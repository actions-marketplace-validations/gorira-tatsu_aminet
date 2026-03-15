import { describe, expect, it } from "bun:test";
import { computeDiff } from "../../../src/core/diff/reporter.js";
import type { Report } from "../../../src/core/report/types.js";

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    root: "root@0.0.0",
    totalPackages: 1,
    directDependencies: 0,
    maxDepth: 0,
    entries: [],
    summary: {
      licenseCounts: { permissive: 0, copyleft: 0, "weak-copyleft": 0, unknown: 0 },
      vulnerabilityCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    },
    ...overrides,
  };
}

describe("computeDiff", () => {
  it("detects added packages", () => {
    const base = makeReport({ entries: [] });
    const head = makeReport({
      entries: [
        {
          name: "lodash",
          version: "4.17.21",
          id: "lodash@4.17.21",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [
            {
              spdxId: "MIT",
              displayName: "MIT License",
              category: "permissive",
              osiApproved: true,
              fsfStatus: "free",
              originalTextUrl: "https://spdx.org/licenses/MIT.html#licenseText",
              japaneseTextUrl: "https://github.com/opensource-jp/licenses/tree/master/MIT",
            },
          ],
          vulnerabilities: [],
        },
      ],
    });

    const diff = computeDiff(base, head);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].name).toBe("lodash");
    expect(diff.removed).toHaveLength(0);
    expect(diff.summary.addedCount).toBe(1);
  });

  it("detects removed packages", () => {
    const base = makeReport({
      entries: [
        {
          name: "lodash",
          version: "4.17.21",
          id: "lodash@4.17.21",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [],
          vulnerabilities: [],
        },
      ],
    });
    const head = makeReport({ entries: [] });

    const diff = computeDiff(base, head);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0].name).toBe("lodash");
    expect(diff.summary.removedCount).toBe(1);
  });

  it("detects updated packages", () => {
    const base = makeReport({
      entries: [
        {
          name: "express",
          version: "4.18.0",
          id: "express@4.18.0",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [],
          vulnerabilities: [],
        },
      ],
    });
    const head = makeReport({
      entries: [
        {
          name: "express",
          version: "4.21.2",
          id: "express@4.21.2",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [],
          vulnerabilities: [],
        },
      ],
    });

    const diff = computeDiff(base, head);
    expect(diff.updated).toHaveLength(1);
    expect(diff.updated[0].previousVersion).toBe("4.18.0");
    expect(diff.updated[0].version).toBe("4.21.2");
    expect(diff.summary.updatedCount).toBe(1);
  });

  it("detects license changes", () => {
    const base = makeReport({
      entries: [
        {
          name: "pkg",
          version: "1.0.0",
          id: "pkg@1.0.0",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [],
          vulnerabilities: [],
        },
      ],
    });
    const head = makeReport({
      entries: [
        {
          name: "pkg",
          version: "2.0.0",
          id: "pkg@2.0.0",
          depth: 1,
          license: "GPL-3.0",
          licenseCategory: "copyleft",
          licenseDetails: [
            {
              spdxId: "GPL-3.0",
              displayName: "GNU General Public License v3.0 only",
              category: "copyleft",
              osiApproved: true,
              fsfStatus: "free",
              originalTextUrl: "https://spdx.org/licenses/GPL-3.0.html#licenseText",
              japaneseTextUrl: "https://github.com/opensource-jp/licenses/tree/master/GPL-3.0",
            },
          ],
          vulnerabilities: [],
        },
      ],
    });

    const diff = computeDiff(base, head);
    expect(diff.licenseChanged).toHaveLength(1);
    expect(diff.licenseChanged[0].previousLicense).toBe("MIT");
    expect(diff.licenseChanged[0].newLicense).toBe("GPL-3.0");
    expect(diff.summary.riskLevel).toBe("critical");
  });

  it("detects new vulnerabilities", () => {
    const base = makeReport({
      entries: [
        {
          name: "pkg",
          version: "1.0.0",
          id: "pkg@1.0.0",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [],
          vulnerabilities: [],
        },
      ],
    });
    const head = makeReport({
      entries: [
        {
          name: "pkg",
          version: "1.0.0",
          id: "pkg@1.0.0",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [],
          vulnerabilities: [{ id: "GHSA-001", summary: "XSS vuln", severity: "HIGH", aliases: [] }],
        },
      ],
    });

    const diff = computeDiff(base, head);
    expect(diff.newVulnerabilities).toHaveLength(1);
    expect(diff.newVulnerabilities[0].vulnerabilities[0].id).toBe("GHSA-001");
    expect(diff.summary.newVulnCount).toBe(1);
    expect(diff.summary.riskLevel).toBe("high");
  });

  it("detects resolved vulnerabilities", () => {
    const base = makeReport({
      entries: [
        {
          name: "pkg",
          version: "1.0.0",
          id: "pkg@1.0.0",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [],
          vulnerabilities: [{ id: "GHSA-001", summary: "XSS vuln", severity: "HIGH", aliases: [] }],
        },
      ],
    });
    const head = makeReport({
      entries: [
        {
          name: "pkg",
          version: "1.0.1",
          id: "pkg@1.0.1",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [],
          vulnerabilities: [],
        },
      ],
    });

    const diff = computeDiff(base, head);
    expect(diff.resolvedVulnerabilities).toHaveLength(1);
    expect(diff.summary.resolvedVulnCount).toBe(1);
  });

  it("returns none risk level for no changes", () => {
    const report = makeReport({
      entries: [
        {
          name: "pkg",
          version: "1.0.0",
          id: "pkg@1.0.0",
          depth: 1,
          license: "MIT",
          licenseCategory: "permissive",
          licenseDetails: [],
          vulnerabilities: [],
        },
      ],
    });
    const diff = computeDiff(report, report);
    expect(diff.summary.riskLevel).toBe("none");
  });

  it("detects new security signals", () => {
    const base = makeReport({ entries: [] });
    const head = makeReport({
      entries: [],
      securitySignals: [
        {
          category: "install-script",
          severity: "high",
          packageId: "pkg@1.0.0",
          name: "pkg",
          version: "1.0.0",
          title: "Install script present",
          description: "postinstall detected",
        },
      ],
    });

    const diff = computeDiff(base, head);
    expect(diff.newSecuritySignals).toHaveLength(1);
    expect(diff.summary.newSecuritySignalCount).toBe(1);
    expect(diff.summary.riskLevel).toBe("high");
  });
});
