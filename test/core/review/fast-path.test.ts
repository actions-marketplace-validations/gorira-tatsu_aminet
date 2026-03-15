import { describe, expect, it } from "bun:test";
import type { Report } from "../../../src/core/report/types.js";
import {
  buildReviewDiff,
  collectDirectDependencies,
  diffDirectDependencies,
  type ReviewPackageAnalysis,
  resolveDirectDependencyVersions,
} from "../../../src/core/review/fast-path.js";

function makeReport(
  name: string,
  version: string,
  options: {
    license?: string | null;
    licenseCategory?: "permissive" | "copyleft" | "weak-copyleft" | "proprietary" | "unknown";
    advisories?: Array<{
      id: string;
      title: string;
      severity: "critical" | "high" | "moderate" | "low" | "unknown";
      aliases?: string[];
      fixedVersion?: string | null;
      sources?: string[];
    }>;
    signals?: Array<{
      category: string;
      severity: "critical" | "high" | "medium" | "low" | "info";
      title: string;
    }>;
  } = {},
): Report {
  const id = `${name}@${version}`;
  return {
    root: id,
    totalPackages: 1,
    directDependencies: 1,
    maxDepth: 1,
    entries: [
      {
        id,
        name,
        version,
        depth: 1,
        license: options.license ?? "MIT",
        licenseCategory: options.licenseCategory ?? "permissive",
        vulnerabilities: [],
        advisories: (options.advisories ?? []).map((advisory) => ({
          id: advisory.id,
          source: "osv",
          sourceId: advisory.id,
          title: advisory.title,
          severity: advisory.severity,
          aliases: advisory.aliases ?? [],
          references: [],
          affected: [],
          fixedVersion: advisory.fixedVersion ?? null,
          sources: advisory.sources ?? ["osv"],
        })),
      },
    ],
    summary: {
      licenseCounts: {
        permissive: options.licenseCategory === "permissive" ? 1 : 0,
        copyleft: options.licenseCategory === "copyleft" ? 1 : 0,
        "weak-copyleft": options.licenseCategory === "weak-copyleft" ? 1 : 0,
        proprietary: options.licenseCategory === "proprietary" ? 1 : 0,
        unknown: options.licenseCategory === "unknown" ? 1 : 0,
      },
      vulnerabilityCount: (options.advisories ?? []).length,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    },
    securitySignals: (options.signals ?? []).map((signal) => ({
      packageId: id,
      name,
      version,
      description: signal.title,
      ...signal,
    })),
  };
}

function makeAnalysis(
  name: string,
  declaredVersion: string | null,
  resolvedVersion: string | null,
  report: Report,
): ReviewPackageAnalysis {
  return {
    name,
    declaredVersion,
    resolvedVersion,
    report,
  };
}

describe("review fast path helpers", () => {
  it("collects direct dependencies and optionally devDependencies", () => {
    const pkg = {
      dependencies: { react: "^18.0.0" },
      devDependencies: { typescript: "^5.0.0" },
    };

    expect(collectDirectDependencies(pkg, false)).toEqual(new Map([["react", "^18.0.0"]]));
    expect(collectDirectDependencies(pkg, true)).toEqual(
      new Map([
        ["react", "^18.0.0"],
        ["typescript", "^5.0.0"],
      ]),
    );
  });

  it("derives resolved direct dependency versions from the lockfile", () => {
    const declared = new Map([
      ["react", "^18.0.0"],
      ["typescript", "^5.0.0"],
    ]);

    const resolved = resolveDirectDependencyVersions(declared, {
      format: "package-lock.json",
      packages: new Map([
        ["react", "18.3.1"],
        ["typescript", "5.8.2"],
      ]),
    });

    expect(resolved.get("react")).toBe("18.3.1");
    expect(resolved.get("typescript")).toBe("5.8.2");
  });

  it("detects declared and resolved direct dependency changes", () => {
    const changes = diffDirectDependencies(
      new Map([
        ["react", "^18.2.0"],
        ["lodash", "^4.17.20"],
      ]),
      new Map([
        ["react", "^18.2.0"],
        ["lodash", "^4.17.21"],
        ["zod", "^3.24.0"],
      ]),
      new Map([
        ["react", "18.3.1"],
        ["lodash", "4.17.20"],
      ]),
      new Map([
        ["react", "18.3.2"],
        ["lodash", "4.17.21"],
        ["zod", "3.24.2"],
      ]),
    );

    expect(changes).toEqual([
      {
        name: "lodash",
        changeType: "updated",
        baseDeclared: "^4.17.20",
        headDeclared: "^4.17.21",
        baseResolved: "4.17.20",
        headResolved: "4.17.21",
      },
      {
        name: "react",
        changeType: "updated",
        baseDeclared: "^18.2.0",
        headDeclared: "^18.2.0",
        baseResolved: "18.3.1",
        headResolved: "18.3.2",
      },
      {
        name: "zod",
        changeType: "added",
        headDeclared: "^3.24.0",
        headResolved: "3.24.2",
      },
    ]);
  });

  it("builds review diff from changed direct dependency analyses", () => {
    const changes = [
      {
        name: "lodash",
        changeType: "updated" as const,
        baseDeclared: "^4.17.20",
        headDeclared: "^4.17.21",
        baseResolved: "4.17.20",
        headResolved: "4.17.21",
      },
      {
        name: "zod",
        changeType: "added" as const,
        headDeclared: "^3.24.0",
        headResolved: "3.24.2",
      },
    ];

    const baseAnalyses = new Map([
      [
        "lodash",
        makeAnalysis(
          "lodash",
          "^4.17.20",
          "4.17.20",
          makeReport("lodash", "4.17.20", {
            advisories: [
              {
                id: "GHSA-old",
                title: "Old issue",
                severity: "moderate",
              },
            ],
          }),
        ),
      ],
    ]);
    const headAnalyses = new Map([
      [
        "lodash",
        makeAnalysis(
          "lodash",
          "^4.17.21",
          "4.17.21",
          makeReport("lodash", "4.17.21", {
            advisories: [
              {
                id: "GHSA-new",
                title: "New issue",
                severity: "high",
                aliases: ["CVE-2026-0001"],
                fixedVersion: "4.17.22",
              },
            ],
            signals: [
              {
                category: "install-script",
                severity: "high",
                title: "Install script present",
              },
            ],
          }),
        ),
      ],
      [
        "zod",
        makeAnalysis(
          "zod",
          "^3.24.0",
          "3.24.2",
          makeReport("zod", "3.24.2", {
            license: "GPL-3.0",
            licenseCategory: "copyleft",
          }),
        ),
      ],
    ]);

    const diff = buildReviewDiff(changes, baseAnalyses, headAnalyses);

    expect(diff.summary.addedCount).toBe(1);
    expect(diff.summary.updatedCount).toBe(1);
    expect(diff.summary.newVulnCount).toBe(1);
    expect(diff.summary.resolvedVulnCount).toBe(1);
    expect(diff.summary.newSecuritySignalCount).toBe(1);
    expect(diff.summary.riskLevel).toBe("critical");
    expect(diff.updated[0]).toMatchObject({
      name: "lodash",
      previousDeclaredVersion: "^4.17.20",
      declaredVersion: "^4.17.21",
      previousResolvedVersion: "4.17.20",
      resolvedVersion: "4.17.21",
    });
    expect(diff.added[0]).toMatchObject({
      name: "zod",
      declaredVersion: "^3.24.0",
      resolvedVersion: "3.24.2",
      licenseCategory: "copyleft",
    });
    expect(diff.newVulnerabilities[0]?.vulnerabilities[0]).toMatchObject({
      id: "GHSA-new",
      aliases: ["CVE-2026-0001"],
      fixedVersion: "4.17.22",
    });
  });
});
