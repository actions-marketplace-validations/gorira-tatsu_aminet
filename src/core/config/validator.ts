import semver from "semver";
import type { AmiConfig } from "./types.js";

export interface ConfigValidationIssue {
  severity: "error" | "warning";
  path: string;
  message: string;
}

const VULN_SOURCES = new Set(["osv", "ghsa", "npm-audit"]);
const VULN_THRESHOLDS = new Set(["low", "medium", "high", "critical"]);
const LICENSE_THRESHOLDS = new Set(["copyleft", "weak-copyleft"]);

export function validateConfig(config: unknown, now = new Date()): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = [];

  if (!isObject(config)) {
    return [
      {
        severity: "error",
        path: "$",
        message: "Config must be a JSON object.",
      },
    ];
  }

  validateStringArray(config, "denyLicenses", issues);
  validateStringArray(config, "allowLicenses", issues);
  validateStringArray(config, "excludePackages", issues);
  validateStringRecord(config, "licenseOverrides", issues);
  validateOptionalString(config, "npmToken", issues);
  validateOptionalBoolean(config, "security", issues);
  validateOptionalBoolean(config, "deepLicenseCheck", issues);
  validateOptionalPositiveInteger(config, "depth", issues);
  validateOptionalPositiveInteger(config, "concurrency", issues);
  validateOptionalEnum(config, "failOnVuln", VULN_THRESHOLDS, issues);
  validateOptionalEnum(config, "failOnLicense", LICENSE_THRESHOLDS, issues);
  validateVulnerabilityIgnores(config as AmiConfig, issues, now);

  return issues;
}

function validateVulnerabilityIgnores(
  config: AmiConfig,
  issues: ConfigValidationIssue[],
  now: Date,
): void {
  if (config.vulnerabilityIgnores === undefined) {
    return;
  }
  if (!Array.isArray(config.vulnerabilityIgnores)) {
    issues.push({
      severity: "error",
      path: "$.vulnerabilityIgnores",
      message: "vulnerabilityIgnores must be an array.",
    });
    return;
  }

  for (let i = 0; i < config.vulnerabilityIgnores.length; i++) {
    const path = `$.vulnerabilityIgnores[${i}]`;
    const rule = config.vulnerabilityIgnores[i] as unknown;
    if (!isObject(rule)) {
      issues.push({ severity: "error", path, message: "Ignore rule must be an object." });
      continue;
    }

    requireNonEmptyString(rule, "package", `${path}.package`, issues);
    requireNonEmptyString(rule, "advisory", `${path}.advisory`, issues);
    requireNonEmptyString(rule, "reason", `${path}.reason`, issues);
    validateOptionalEnum(rule, "source", VULN_SOURCES, issues, path);
    validateOptionalString(rule, "versions", issues, path);
    validateOptionalString(rule, "expires", issues, path);

    if (typeof rule.versions === "string" && semver.validRange(rule.versions) === null) {
      issues.push({
        severity: "error",
        path: `${path}.versions`,
        message: "versions must be a valid semver range.",
      });
    }

    if (typeof rule.expires === "string") {
      const expiresAt = parseDateOnly(rule.expires);
      if (!expiresAt) {
        issues.push({
          severity: "error",
          path: `${path}.expires`,
          message: "expires must use YYYY-MM-DD format.",
        });
      } else if (expiresAt.getTime() < startOfUtcDay(now).getTime()) {
        issues.push({
          severity: "error",
          path: `${path}.expires`,
          message: "expires is in the past.",
        });
      }
    } else {
      issues.push({
        severity: "warning",
        path: `${path}.expires`,
        message: "Add an expires date so suppressions are reviewed periodically.",
      });
    }
  }
}

function validateStringArray(
  config: Record<string, unknown>,
  key: keyof AmiConfig,
  issues: ConfigValidationIssue[],
): void {
  const value = config[key];
  if (value === undefined) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    issues.push({
      severity: "error",
      path: `$.${key}`,
      message: `${key} must be an array of strings.`,
    });
  }
}

function validateStringRecord(
  config: Record<string, unknown>,
  key: keyof AmiConfig,
  issues: ConfigValidationIssue[],
): void {
  const value = config[key];
  if (value === undefined) return;
  if (!isObject(value) || Object.values(value).some((item) => typeof item !== "string")) {
    issues.push({
      severity: "error",
      path: `$.${key}`,
      message: `${key} must be an object with string values.`,
    });
  }
}

function validateOptionalBoolean(
  config: Record<string, unknown>,
  key: keyof AmiConfig,
  issues: ConfigValidationIssue[],
): void {
  const value = config[key];
  if (value !== undefined && typeof value !== "boolean") {
    issues.push({
      severity: "error",
      path: `$.${key}`,
      message: `${key} must be a boolean.`,
    });
  }
}

function validateOptionalPositiveInteger(
  config: Record<string, unknown>,
  key: keyof AmiConfig,
  issues: ConfigValidationIssue[],
): void {
  const value = config[key];
  if (value === undefined) return;
  if (!Number.isInteger(value) || Number(value) <= 0) {
    issues.push({
      severity: "error",
      path: `$.${key}`,
      message: `${key} must be a positive integer.`,
    });
  }
}

function validateOptionalString(
  config: Record<string, unknown>,
  key: string,
  issues: ConfigValidationIssue[],
  basePath = "$",
): void {
  const value = config[key];
  if (value !== undefined && typeof value !== "string") {
    issues.push({
      severity: "error",
      path: `${basePath}.${key}`,
      message: `${key} must be a string.`,
    });
  }
}

function validateOptionalEnum(
  config: Record<string, unknown>,
  key: string,
  allowed: ReadonlySet<string>,
  issues: ConfigValidationIssue[],
  basePath = "$",
): void {
  const value = config[key];
  if (value === undefined) return;
  if (typeof value !== "string" || !allowed.has(value)) {
    issues.push({
      severity: "error",
      path: `${basePath}.${key}`,
      message: `${key} must be one of: ${[...allowed].join(", ")}.`,
    });
  }
}

function requireNonEmptyString(
  config: Record<string, unknown>,
  key: string,
  path: string,
  issues: ConfigValidationIssue[],
): void {
  const value = config[key];
  if (typeof value !== "string" || value.trim() === "") {
    issues.push({
      severity: "error",
      path,
      message: `${key} is required and must be a non-empty string.`,
    });
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
