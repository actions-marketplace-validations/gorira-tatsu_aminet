import Table from "cli-table3";
import chalk from "chalk";
import type { Report } from "../../core/report/types.js";
import type { LicenseCategory } from "../../core/graph/types.js";
import { parseLicenseComponents } from "../../core/license/spdx.js";
import { getContextNotes } from "../../core/license/context-notes.js";

export function renderTable(report: Report): void {
  console.log();
  console.log(chalk.bold(`📦 ${report.root}`));
  console.log(
    `Total packages: ${report.totalPackages} | Direct deps: ${report.directDependencies} | Max depth: ${report.maxDepth}`,
  );
  console.log();

  const table = new Table({
    head: [
      chalk.cyan("Package"),
      chalk.cyan("Version"),
      chalk.cyan("Depth"),
      chalk.cyan("License"),
      chalk.cyan("Vulnerabilities"),
    ],
    colWidths: [35, 12, 7, 20, 40],
    wordWrap: true,
  });

  for (const entry of report.entries) {
    const vulnText =
      entry.vulnerabilities.length > 0
        ? entry.vulnerabilities
            .map((v) => {
              const sev = v.severity
                ? colorSeverity(v.severity)
                : chalk.gray("?");
              return `${sev} ${v.id}`;
            })
            .join("\n")
        : chalk.green("none");

    table.push([
      entry.name,
      entry.version,
      String(entry.depth),
      colorLicense(entry.license, entry.licenseCategory),
      vulnText,
    ]);
  }

  console.log(table.toString());
  console.log();

  // Summary
  renderSummary(report);

  // Context notes for copyleft/weak-copyleft licenses
  const allLicenses = report.entries
    .map((e) => e.license)
    .filter((l): l is string => l !== null);
  const contextNotes = getContextNotes(allLicenses);
  if (contextNotes.length > 0) {
    console.log(chalk.bold("License Notes:"));
    for (const cn of contextNotes) {
      console.log(`  ${chalk.yellow(cn.license)}: ${cn.note}`);
    }
    console.log();
  }
}

function colorLicense(
  license: string | null,
  category: LicenseCategory,
): string {
  if (!license) return chalk.gray("UNKNOWN");

  // For compound SPDX expressions, color each component individually
  if (license.includes(" OR ") || license.includes(" AND ")) {
    const separator = license.includes(" OR ") ? " OR " : " AND ";
    const components = parseLicenseComponents(license);
    const colored = components.map((c) => colorByCategory(c.spdxId, c.category));
    return colored.join(chalk.white(separator));
  }

  return colorByCategory(license, category);
}

function colorByCategory(text: string, category: LicenseCategory): string {
  switch (category) {
    case "permissive":
      return chalk.green(text);
    case "copyleft":
      return chalk.red(text);
    case "weak-copyleft":
      return chalk.yellow(text);
    default:
      return chalk.gray(text);
  }
}

function colorSeverity(severity: string): string {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return chalk.bgRed.white(" CRITICAL ");
    case "HIGH":
      return chalk.red("HIGH");
    case "MEDIUM":
      return chalk.yellow("MEDIUM");
    case "LOW":
      return chalk.blue("LOW");
    default:
      return chalk.gray(severity);
  }
}

function renderSummary(report: Report): void {
  const { summary } = report;

  console.log(chalk.bold("Summary:"));
  console.log(
    `  Licenses: ${chalk.green(summary.licenseCounts.permissive + " permissive")}, ${chalk.yellow(summary.licenseCounts["weak-copyleft"] + " weak-copyleft")}, ${chalk.red(summary.licenseCounts.copyleft + " copyleft")}, ${chalk.gray(summary.licenseCounts.unknown + " unknown")}`,
  );

  if (summary.vulnerabilityCount > 0) {
    console.log(
      `  Vulnerabilities: ${chalk.red(summary.vulnerabilityCount + " total")} (${summary.criticalCount} critical, ${summary.highCount} high, ${summary.mediumCount} medium, ${summary.lowCount} low)`,
    );
  } else {
    console.log(`  Vulnerabilities: ${chalk.green("0 found")}`);
  }
  console.log();
}
