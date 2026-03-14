import ora from "ora";
import chalk from "chalk";
import { resolveDependencyGraph } from "../../core/graph/resolver.js";
import { scanVulnerabilities } from "../../core/vulnerability/scanner.js";
import { buildReport } from "../../core/report/builder.js";
import { renderTable } from "../output/table.js";
import { renderJson } from "../output/json.js";
import { renderTree } from "../output/tree.js";
import { renderGraphviz } from "../output/graphviz.js";
import { renderMermaid } from "../output/mermaid.js";
import { renderNotices, renderNoticesJson } from "../output/notices.js";
import { setLogLevel } from "../../utils/logger.js";
import { logger } from "../../utils/logger.js";
import { setNpmCacheEnabled } from "../../core/registry/npm-client.js";
import { getDatabase } from "../../core/store/database.js";
import { loadConfig } from "../../core/config/loader.js";
import { checkDenyList } from "../../core/license/deny-list.js";
import { extractLicenseFiles } from "../../core/license/tarball-checker.js";
import type { AnalyzeOptions } from "../options.js";
import type { AmiConfig } from "../../core/config/types.js";
import type { DependencyGraph } from "../../core/graph/types.js";
import type { VulnerabilityResult } from "../../core/vulnerability/types.js";
import type { Report } from "../../core/report/types.js";
import { readFile } from "fs/promises";

export async function analyzeCommand(
  target: string,
  options: AnalyzeOptions,
): Promise<void> {
  if (options.verbose) {
    setLogLevel("debug");
  }

  // Load config and merge with CLI options
  const config = loadConfig();
  mergeConfig(options, config);

  // CI mode defaults
  if (options.ci) {
    if (!options.failOnVuln) {
      options.failOnVuln = "high";
    }
    // Force JSON for CI unless other format specified
    if (!options.dot && !options.mermaid && !options.tree && !options.notices) {
      options.json = true;
    }
  }

  // Initialize DB (ensures ~/.ami/ exists)
  getDatabase();

  if (options.noCache) {
    setNpmCacheEnabled(false);
  }

  const isCi = options.ci || false;
  const useSpinner = !isCi && !options.dot && !options.mermaid;

  if (options.file) {
    await analyzeFile(target, options, config, useSpinner);
    return;
  }

  const parsed = parsePackageSpec(target);
  await analyzePackage(parsed.name, parsed.versionRange, options, config, useSpinner);
}

function mergeConfig(options: AnalyzeOptions, config: AmiConfig): void {
  // CLI takes precedence over config
  if (options.depth === undefined && config.depth !== undefined) {
    options.depth = config.depth;
  }
  if (options.concurrency === undefined && config.concurrency !== undefined) {
    options.concurrency = config.concurrency;
  }
  if (!options.failOnVuln && config.failOnVuln) {
    options.failOnVuln = config.failOnVuln;
  }
  if (!options.failOnLicense && config.failOnLicense) {
    options.failOnLicense = config.failOnLicense;
  }
  if (!options.denyLicense && config.denyLicenses && config.denyLicenses.length > 0) {
    options.denyLicense = config.denyLicenses.join(",");
  }
  if (options.deepLicenseCheck === undefined && config.deepLicenseCheck) {
    options.deepLicenseCheck = config.deepLicenseCheck;
  }
}

async function analyzeFile(
  filePath: string,
  options: AnalyzeOptions,
  config: AmiConfig,
  useSpinner: boolean,
): Promise<void> {
  const content = await readFile(filePath, "utf-8");
  const pkg = JSON.parse(content);

  const allDeps: Record<string, string> = {
    ...(pkg.dependencies ?? {}),
    ...(options.dev ? pkg.devDependencies ?? {} : {}),
  };

  const depEntries = Object.entries(allDeps);
  if (depEntries.length === 0) {
    console.error(chalk.yellow("No dependencies found in " + filePath));
    return;
  }

  const spinner = useSpinner
    ? ora(`Analyzing ${depEntries.length} dependencies from ${filePath}...`).start()
    : null;

  if (!useSpinner) {
    logger.info(`Analyzing ${depEntries.length} dependencies from ${filePath}`);
  }

  // Resolve each dependency individually
  const allNodes = new Map<string, import("../../core/graph/types.js").PackageNode>();
  const allEdges: import("../../core/graph/types.js").DependencyEdge[] = [];
  let rootId = pkg.name ? `${pkg.name}@${pkg.version ?? "0.0.0"}` : "root@0.0.0";
  let resolvedCount = 0;
  let skippedCount = 0;

  // Create a virtual root node
  const rootDeps = new Map(depEntries.map(([n, v]) => [n, v as string]));
  allNodes.set(rootId, {
    id: rootId,
    name: pkg.name ?? "root",
    version: pkg.version ?? "0.0.0",
    license: null,
    licenseCategory: "unknown",
    depth: 0,
    parents: new Set(),
    dependencies: rootDeps,
  });

  for (const [depName, depRange] of depEntries) {
    try {
      const graph = await resolveDependencyGraph(
        depName,
        depRange as string,
        {
          maxDepth: options.depth,
          concurrency: options.concurrency ?? 5,
        },
      );

      // Merge into combined graph
      for (const [id, node] of graph.nodes) {
        if (!allNodes.has(id)) {
          // Adjust depth (+1 because relative to our virtual root)
          node.depth += 1;
          allNodes.set(id, node);
        }
      }
      for (const edge of graph.edges) {
        allEdges.push(edge);
      }
      // Add edge from virtual root to this dependency's root
      allEdges.push({ from: rootId, to: graph.root, versionRange: depRange as string });

      resolvedCount++;
      if (spinner) {
        spinner.text = `Resolving dependencies... (${resolvedCount}/${depEntries.length} direct deps, ${skippedCount} skipped)`;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("not found")) {
        logger.warn(`Skipping private/unavailable package: ${depName}`);
        skippedCount++;
      } else {
        logger.warn(`Failed to resolve ${depName}: ${msg}`);
        skippedCount++;
      }
      if (spinner) {
        spinner.text = `Resolving dependencies... (${resolvedCount}/${depEntries.length} direct deps, ${skippedCount} skipped)`;
      }
    }
  }

  const combinedGraph: DependencyGraph = {
    root: rootId,
    nodes: allNodes,
    edges: allEdges,
  };

  if (spinner) {
    spinner.succeed(
      `Resolved ${allNodes.size} packages from ${resolvedCount} deps (${skippedCount} skipped)`,
    );
  }

  // Apply license overrides
  applyLicenseOverrides(combinedGraph, config);

  // Vulnerability scan and output
  const vulnerabilities = await scanPhase(combinedGraph, options, useSpinner);

  // Deep license check
  if (options.deepLicenseCheck) {
    await deepLicenseCheckPhase(combinedGraph, useSpinner);
  }

  outputAndExit(combinedGraph, vulnerabilities, options, config);
}

async function analyzePackage(
  packageName: string,
  versionRange: string,
  options: AnalyzeOptions,
  config: AmiConfig,
  useSpinner: boolean,
): Promise<void> {
  // Phase 1: Resolve dependency graph
  const spinner = useSpinner
    ? ora(`Resolving dependencies for ${packageName}@${versionRange}...`).start()
    : null;

  if (!useSpinner) {
    logger.info(`Resolving dependencies for ${packageName}@${versionRange}`);
  }

  let graph: DependencyGraph;
  try {
    graph = await resolveDependencyGraph(
      packageName,
      versionRange,
      {
        maxDepth: options.depth,
        concurrency: options.concurrency ?? 5,
        includeDev: options.dev,
      },
      (resolved, pending) => {
        if (spinner) {
          spinner.text = `Resolving dependencies... (${resolved} resolved, ${pending} pending)`;
        }
      },
    );
    if (spinner) {
      spinner.succeed(
        `Resolved ${graph.nodes.size} packages (${graph.edges.length} edges)`,
      );
    }
  } catch (error) {
    if (spinner) {
      spinner.fail("Failed to resolve dependencies");
    }
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }

  // Apply license overrides
  applyLicenseOverrides(graph, config);

  const vulnerabilities = await scanPhase(graph, options, useSpinner);

  // Deep license check
  if (options.deepLicenseCheck) {
    await deepLicenseCheckPhase(graph, useSpinner);
  }

  outputAndExit(graph, vulnerabilities, options, config);
}

function applyLicenseOverrides(graph: DependencyGraph, config: AmiConfig): void {
  if (!config.licenseOverrides) return;

  const { classifyLicense } = require("../../core/license/spdx.js");
  for (const [pkgId, spdxId] of Object.entries(config.licenseOverrides)) {
    const node = graph.nodes.get(pkgId);
    if (node) {
      logger.debug(`License override: ${pkgId} -> ${spdxId}`);
      node.license = spdxId;
      node.licenseCategory = classifyLicense(spdxId);
    }
  }
}

async function deepLicenseCheckPhase(
  graph: DependencyGraph,
  useSpinner: boolean,
): Promise<void> {
  const spinner = useSpinner
    ? ora("Checking LICENSE files from tarballs...").start()
    : null;

  if (!useSpinner) {
    logger.info("Checking LICENSE files from tarballs...");
  }

  let checked = 0;
  let mismatches = 0;
  const warnings: string[] = [];

  // We need access to the packument data for tarball URLs
  // Import the npm client to get packument data
  const { getPackument } = require("../../core/registry/npm-client.js");

  for (const node of graph.nodes.values()) {
    if (node.depth === 0) continue; // skip root

    try {
      const packument = await getPackument(node.name);
      const versionInfo = packument.versions?.[node.version];
      if (!versionInfo?.dist?.tarball) continue;

      const result = await extractLicenseFiles(versionInfo.dist.tarball);
      checked++;

      if (result.detectedLicense && node.license) {
        if (result.detectedLicense !== node.license) {
          // Check if it's a genuine mismatch (not just a variant)
          const declared = node.license;
          const detected = result.detectedLicense;
          if (!isLicenseVariant(declared, detected)) {
            mismatches++;
            const msg = `${node.id}: package.json declares "${declared}" but LICENSE file suggests "${detected}"`;
            warnings.push(msg);
          }
        }
      }

      if (spinner) {
        spinner.text = `Checking LICENSE files... (${checked} checked, ${mismatches} mismatches)`;
      }
    } catch {
      // Skip packages we can't check
    }
  }

  if (spinner) {
    if (mismatches > 0) {
      spinner.warn(`Checked ${checked} LICENSE files, ${mismatches} mismatch(es)`);
    } else {
      spinner.succeed(`Checked ${checked} LICENSE files, no mismatches`);
    }
  }

  for (const w of warnings) {
    console.error(chalk.yellow(`  ⚠ ${w}`));
  }
}

function isLicenseVariant(declared: string, detected: string): boolean {
  // Treat GPL-3.0 and GPL-3.0-only as the same
  const normalize = (s: string) =>
    s.replace(/-only$/, "").replace(/-or-later$/, "");
  return normalize(declared) === normalize(detected);
}

async function scanPhase(
  graph: DependencyGraph,
  options: AnalyzeOptions,
  useSpinner: boolean,
): Promise<VulnerabilityResult[]> {
  const spinner = useSpinner
    ? ora("Scanning for vulnerabilities...").start()
    : null;

  if (!useSpinner) {
    logger.info("Scanning for vulnerabilities...");
  }

  let vulnerabilities: VulnerabilityResult[];
  try {
    vulnerabilities = await scanVulnerabilities(
      graph,
      options.concurrency ?? 5,
      !options.noCache,
    );
    const totalVulns = vulnerabilities.reduce(
      (sum, v) => sum + v.vulnerabilities.length,
      0,
    );
    if (totalVulns > 0) {
      if (spinner) {
        spinner.warn(
          chalk.yellow(
            `Found ${totalVulns} vulnerabilities in ${vulnerabilities.length} packages`,
          ),
        );
      }
    } else {
      if (spinner) {
        spinner.succeed("No vulnerabilities found");
      }
    }
  } catch (error) {
    if (spinner) {
      spinner.warn("Vulnerability scan failed, continuing without results");
    }
    vulnerabilities = [];
  }

  return vulnerabilities;
}

function outputAndExit(
  graph: DependencyGraph,
  vulnerabilities: VulnerabilityResult[],
  options: AnalyzeOptions,
  config: AmiConfig,
): void {
  const report = buildReport(graph, vulnerabilities);

  // Output
  if (options.notices) {
    if (options.json) {
      renderNoticesJson(report);
    } else {
      renderNotices(report);
    }
  } else if (options.dot) {
    renderGraphviz(graph, vulnerabilities);
  } else if (options.mermaid) {
    renderMermaid(graph, vulnerabilities);
  } else if (options.tree) {
    renderTree(graph, vulnerabilities);
  } else if (options.json) {
    renderJson(report);
  } else {
    renderTable(report);
  }

  // Deny-list check
  let denyListExitCode = 0;
  if (options.denyLicense) {
    const denied = options.denyLicense.split(",").map((s) => s.trim());
    const violations = checkDenyList(report.entries, denied);

    if (violations.length > 0) {
      console.error("");
      console.error(chalk.red.bold("Deny-list violations:"));
      for (const v of violations) {
        if (v.isOrExpression) {
          const nonDenied = v.license
            .split(" OR ")
            .map((p) => p.trim())
            .filter((p) => !v.deniedIds.includes(p));
          console.error(
            chalk.yellow(
              `  ⚠ ${v.packageId}: "${v.license}" contains denied ${v.deniedIds.join(", ")} (can use ${nonDenied.join(" or ")} instead)`,
            ),
          );
        } else {
          console.error(
            chalk.red(
              `  ✗ ${v.packageId}: "${v.license}" is denied`,
            ),
          );
        }
      }

      // Only exit 4 if there are hard violations (all alternatives denied or non-OR)
      const hardViolations = violations.filter((v) => {
        if (!v.isOrExpression) return true;
        // OR expression: check if ALL alternatives are denied
        const parts = v.license.split(" OR ").map((p) => p.trim());
        return parts.every((p) => denied.includes(p));
      });
      if (hardViolations.length > 0) {
        denyListExitCode = 4;
      }
    }
  }

  // Allow-list check
  if (config.allowLicenses && config.allowLicenses.length > 0) {
    const allowSet = new Set(config.allowLicenses);
    const unlisted = report.entries.filter((e) => {
      if (!e.license) return true;
      // For compound expressions, check each component
      const parts = e.license.split(/ (?:OR|AND) /).map((p) => p.trim());
      return !parts.some((p) => allowSet.has(p));
    });

    if (unlisted.length > 0) {
      console.error("");
      console.error(chalk.yellow.bold("Licenses not in allow-list:"));
      for (const e of unlisted) {
        console.error(
          chalk.yellow(`  ⚠ ${e.id}: ${e.license ?? "UNKNOWN"}`),
        );
      }
    }
  }

  // CI exit codes
  let exitCode = denyListExitCode;
  if (options.failOnVuln || options.failOnLicense) {
    exitCode |= computeExitCode(report, options);

    // Write GitHub Actions step summary if available
    if (process.env.GITHUB_ACTIONS && process.env.GITHUB_STEP_SUMMARY) {
      writeGitHubSummary(report);
    }
  }

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

function computeExitCode(report: Report, options: AnalyzeOptions): number {
  let code = 0;

  // Check vulnerabilities
  if (options.failOnVuln) {
    const threshold = options.failOnVuln.toLowerCase();
    const { summary } = report;
    let vulnFound = false;

    switch (threshold) {
      case "critical":
        vulnFound = summary.criticalCount > 0;
        break;
      case "high":
        vulnFound = summary.criticalCount > 0 || summary.highCount > 0;
        break;
      case "medium":
        vulnFound =
          summary.criticalCount > 0 ||
          summary.highCount > 0 ||
          summary.mediumCount > 0;
        break;
      case "low":
        vulnFound = summary.vulnerabilityCount > 0;
        break;
    }

    if (vulnFound) code |= 1;
  }

  // Check licenses
  if (options.failOnLicense) {
    const threshold = options.failOnLicense.toLowerCase();
    const { licenseCounts } = report.summary;
    let licenseViolation = false;

    if (threshold === "copyleft") {
      licenseViolation = licenseCounts.copyleft > 0;
    } else if (threshold === "weak-copyleft") {
      licenseViolation =
        licenseCounts.copyleft > 0 || licenseCounts["weak-copyleft"] > 0;
    }

    if (licenseViolation) code |= 2;
  }

  return code;
}

function writeGitHubSummary(report: Report): void {
  try {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY!;
    const { summary } = report;
    const lines = [
      "## ami Security Report",
      "",
      `| Metric | Count |`,
      `|--------|-------|`,
      `| Total packages | ${report.totalPackages} |`,
      `| Vulnerabilities | ${summary.vulnerabilityCount} |`,
      `| Critical | ${summary.criticalCount} |`,
      `| High | ${summary.highCount} |`,
      `| Medium | ${summary.mediumCount} |`,
      `| Low | ${summary.lowCount} |`,
      `| Copyleft licenses | ${summary.licenseCounts.copyleft} |`,
      `| Weak-copyleft licenses | ${summary.licenseCounts["weak-copyleft"]} |`,
      "",
    ];
    const { appendFileSync } = require("fs");
    appendFileSync(summaryPath, lines.join("\n"));
  } catch {
    // Non-critical
  }
}

function parsePackageSpec(spec: string): {
  name: string;
  versionRange: string;
} {
  // Handle scoped packages: @scope/name@version
  if (spec.startsWith("@")) {
    const slashIndex = spec.indexOf("/");
    if (slashIndex === -1) {
      throw new Error(`Invalid package spec: ${spec}`);
    }
    const rest = spec.slice(slashIndex + 1);
    const atIndex = rest.lastIndexOf("@");
    if (atIndex > 0) {
      return {
        name: spec.slice(0, slashIndex + 1 + atIndex),
        versionRange: rest.slice(atIndex + 1),
      };
    }
    return { name: spec, versionRange: "latest" };
  }

  // Regular packages: name@version
  const atIndex = spec.lastIndexOf("@");
  if (atIndex > 0) {
    return {
      name: spec.slice(0, atIndex),
      versionRange: spec.slice(atIndex + 1),
    };
  }

  return { name: spec, versionRange: "latest" };
}
