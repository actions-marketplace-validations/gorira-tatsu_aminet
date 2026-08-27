import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import { validateConfig } from "../../core/config/validator.js";

export function validateConfigCommand(configPath = "aminet.config.json"): void {
  const resolvedPath = resolve(configPath);
  if (!existsSync(resolvedPath)) {
    console.error(chalk.red(`Config file not found: ${resolvedPath}`));
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(resolvedPath, "utf-8"));
  } catch (error) {
    console.error(
      chalk.red(
        `Failed to parse ${resolvedPath}: ${error instanceof Error ? error.message : error}`,
      ),
    );
    process.exit(1);
  }

  const issues = validateConfig(parsed);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  for (const issue of errors) {
    console.error(chalk.red(`error ${issue.path}: ${issue.message}`));
  }
  for (const issue of warnings) {
    console.error(chalk.yellow(`warning ${issue.path}: ${issue.message}`));
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  console.log(chalk.green(`Config is valid: ${resolvedPath}`));
}
