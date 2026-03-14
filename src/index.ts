#!/usr/bin/env bun
import { Command } from "commander";
import { analyzeCommand } from "./cli/commands/analyze.js";
import { cacheStatsCommand, cacheClearCommand } from "./cli/commands/cache.js";

const program = new Command();

program
  .name("ami")
  .description("Software supply chain security tool for npm packages")
  .version("0.1.0");

// analyze command
program
  .command("analyze")
  .description("Analyze dependencies, licenses, and vulnerabilities")
  .argument("<package>", "Package to analyze (e.g., express@4.21.2)")
  .option("--json", "Output as JSON")
  .option("--tree", "Output as dependency tree")
  .option("--dot", "Output as Graphviz DOT format")
  .option("--mermaid", "Output as Mermaid diagram")
  .option("-d, --depth <number>", "Maximum dependency depth", parseInt)
  .option(
    "-c, --concurrency <number>",
    "Maximum concurrent requests",
    parseInt,
  )
  .option("--dev", "Include devDependencies")
  .option("--file", "Treat argument as path to package.json")
  .option("--no-cache", "Skip cache reads (still writes)")
  .option("-v, --verbose", "Verbose logging")
  .option("--ci", "CI mode (no spinner, exit codes enabled)")
  .option(
    "--fail-on-vuln <severity>",
    "Exit non-zero on vulnerabilities at or above severity (low/medium/high/critical)",
  )
  .option(
    "--fail-on-license <category>",
    "Exit non-zero on license category (copyleft/weak-copyleft)",
  )
  .option(
    "--deny-license <licenses>",
    "Comma-separated list of SPDX IDs to deny (e.g., GPL-3.0,AGPL-3.0)",
  )
  .option("--notices", "Output third-party license attribution list")
  .option(
    "--deep-license-check",
    "Verify LICENSE files from npm tarballs",
  )
  .action(analyzeCommand);

// ci command (alias for analyze --ci --json)
program
  .command("ci")
  .description("CI-optimized analysis (alias for analyze --ci --json)")
  .argument("<package>", "Package or --file path to analyze")
  .option("--file", "Treat argument as path to package.json")
  .option("-d, --depth <number>", "Maximum dependency depth", parseInt)
  .option("--dev", "Include devDependencies")
  .option(
    "--fail-on-vuln <severity>",
    "Exit non-zero on vulnerabilities (default: high)",
  )
  .option(
    "--fail-on-license <category>",
    "Exit non-zero on license category",
  )
  .option(
    "--deny-license <licenses>",
    "Comma-separated list of SPDX IDs to deny",
  )
  .action((target, opts) => {
    return analyzeCommand(target, { ...opts, ci: true, json: true });
  });

// cache commands
const cache = program
  .command("cache")
  .description("Manage the local cache");

cache
  .command("stats")
  .description("Show cache statistics")
  .action(cacheStatsCommand);

cache
  .command("clear")
  .description("Clear all cached data")
  .action(cacheClearCommand);

program.parse();
