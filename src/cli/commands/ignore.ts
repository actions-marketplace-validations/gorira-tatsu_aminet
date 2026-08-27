import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import type { AmiConfig, VulnerabilityIgnoreRule } from "../../core/config/types.js";
import { type ConfigValidationIssue, validateConfig } from "../../core/config/validator.js";

const DEFAULT_CONFIG_PATH = "aminet.config.json";

export interface IgnoreAddOptions {
  config?: string;
  source?: string;
  versions?: string;
  reason?: string;
  expires?: string;
}

export interface IgnoreListOptions {
  config?: string;
}

export function ignoreAddCommand(
  packageName: string,
  advisory: string,
  options: IgnoreAddOptions,
): void {
  const configPath = resolve(options.config ?? DEFAULT_CONFIG_PATH);
  const config = readConfigOrEmpty(configPath);

  if (config.vulnerabilityIgnores !== undefined && !Array.isArray(config.vulnerabilityIgnores)) {
    console.error(chalk.red("vulnerabilityIgnores must be an array before adding a rule."));
    process.exit(1);
  }

  const rule: VulnerabilityIgnoreRule = {
    package: packageName,
    advisory,
    ...(options.source ? { source: options.source as VulnerabilityIgnoreRule["source"] } : {}),
    ...(options.versions ? { versions: options.versions } : {}),
    ...(options.reason ? { reason: options.reason } : {}),
    ...(options.expires ? { expires: options.expires } : {}),
  };

  const rules = config.vulnerabilityIgnores ?? [];
  if (rules.some((existing) => isSameRule(existing, rule))) {
    console.error(chalk.yellow("A matching vulnerability ignore rule already exists."));
    process.exit(1);
  }

  const nextConfig: AmiConfig = {
    ...config,
    vulnerabilityIgnores: [...rules, rule],
  };

  const issues = validateConfig(nextConfig);
  printValidationIssues(issues);
  if (issues.some((issue) => issue.severity === "error")) {
    process.exit(1);
  }

  writeFileSync(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf-8");
  console.log(chalk.green(`Added vulnerability ignore to ${configPath}`));
}

export function ignoreListCommand(options: IgnoreListOptions): void {
  const configPath = resolve(options.config ?? DEFAULT_CONFIG_PATH);
  if (!existsSync(configPath)) {
    console.log("No vulnerability ignores configured.");
    return;
  }

  const config = readConfigOrEmpty(configPath);
  const rules = Array.isArray(config.vulnerabilityIgnores) ? config.vulnerabilityIgnores : [];
  if (rules.length === 0) {
    console.log("No vulnerability ignores configured.");
    return;
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const parts = [
      `${i + 1}. ${rule.package} ${rule.advisory}`,
      rule.source ? `source=${rule.source}` : null,
      rule.versions ? `versions=${rule.versions}` : null,
      rule.expires ? `expires=${rule.expires}` : null,
    ].filter((part): part is string => Boolean(part));
    console.log(parts.join(" | "));
    if (rule.reason) {
      console.log(`   reason: ${rule.reason}`);
    }
  }
}

function readConfigOrEmpty(configPath: string): AmiConfig {
  if (!existsSync(configPath)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(configPath, "utf-8")) as AmiConfig;
  } catch (error) {
    console.error(
      chalk.red(`Failed to parse ${configPath}: ${error instanceof Error ? error.message : error}`),
    );
    process.exit(1);
  }
}

function printValidationIssues(issues: ConfigValidationIssue[]): void {
  for (const issue of issues) {
    const message = `${issue.severity} ${issue.path}: ${issue.message}`;
    if (issue.severity === "error") {
      console.error(chalk.red(message));
    } else {
      console.error(chalk.yellow(message));
    }
  }
}

function isSameRule(a: VulnerabilityIgnoreRule, b: VulnerabilityIgnoreRule): boolean {
  return (
    a.package === b.package &&
    a.advisory === b.advisory &&
    a.source === b.source &&
    a.versions === b.versions
  );
}
