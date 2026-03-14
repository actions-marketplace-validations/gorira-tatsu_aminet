import { describe, expect, test } from "bun:test";
import { renderNotices } from "../../../src/cli/output/notices.js";
import type { Report } from "../../../src/core/report/types.js";

function makeReport(): Report {
  return {
    root: "express@4.21.2",
    totalPackages: 3,
    directDependencies: 2,
    maxDepth: 1,
    entries: [
      {
        name: "express",
        version: "4.21.2",
        id: "express@4.21.2",
        depth: 0,
        license: "MIT",
        licenseCategory: "permissive",
        vulnerabilities: [],
      },
      {
        name: "body-parser",
        version: "1.20.3",
        id: "body-parser@1.20.3",
        depth: 1,
        license: "MIT",
        licenseCategory: "permissive",
        vulnerabilities: [],
      },
      {
        name: "qs",
        version: "6.5.2",
        id: "qs@6.5.2",
        depth: 1,
        license: "BSD-3-Clause",
        licenseCategory: "permissive",
        vulnerabilities: [],
      },
    ],
    summary: {
      licenseCounts: { permissive: 3, copyleft: 0, "weak-copyleft": 0, unknown: 0 },
      vulnerabilityCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    },
  };
}

describe("renderNotices", () => {
  test("outputs header section", () => {
    const output: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => output.push(args.join(" "));

    renderNotices(makeReport());

    console.log = originalLog;
    const text = output.join("\n");

    expect(text).toContain("THIRD-PARTY SOFTWARE NOTICES");
    expect(text).toContain("Generated for: express@4.21.2");
  });

  test("outputs license summary", () => {
    const output: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => output.push(args.join(" "));

    renderNotices(makeReport());

    console.log = originalLog;
    const text = output.join("\n");

    expect(text).toContain("LICENSE SUMMARY");
    expect(text).toContain("MIT: 2 package(s)");
    expect(text).toContain("BSD-3-Clause: 1 package(s)");
  });

  test("outputs package details", () => {
    const output: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => output.push(args.join(" "));

    renderNotices(makeReport());

    console.log = originalLog;
    const text = output.join("\n");

    expect(text).toContain("PACKAGE DETAILS");
    expect(text).toContain("express@4.21.2 - MIT");
    expect(text).toContain("body-parser@1.20.3 - MIT");
    expect(text).toContain("qs@6.5.2 - BSD-3-Clause");
  });
});
