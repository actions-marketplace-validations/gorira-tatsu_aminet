import { describe, expect, test } from "bun:test";
import { renderMermaid } from "../../../src/cli/output/mermaid.js";
import type { DependencyGraph, PackageNode } from "../../../src/core/graph/types.js";

function makeGraph(): DependencyGraph {
  const nodes = new Map<string, PackageNode>();
  nodes.set("express@4.21.2", {
    id: "express@4.21.2",
    name: "express",
    version: "4.21.2",
    license: "MIT",
    licenseCategory: "permissive",
    depth: 0,
    parents: new Set(),
    dependencies: new Map([["qs", "6.5.2"]]),
  });
  nodes.set("qs@6.5.2", {
    id: "qs@6.5.2",
    name: "qs",
    version: "6.5.2",
    license: "BSD-3-Clause",
    licenseCategory: "permissive",
    depth: 1,
    parents: new Set(["express@4.21.2"]),
    dependencies: new Map(),
  });

  return {
    root: "express@4.21.2",
    nodes,
    edges: [{ from: "express@4.21.2", to: "qs@6.5.2", versionRange: "6.5.2" }],
  };
}

describe("renderMermaid", () => {
  test("produces valid Mermaid syntax", () => {
    const output: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => output.push(args.join(" "));

    renderMermaid(makeGraph(), []);

    console.log = originalLog;
    const mermaid = output.join("\n");

    expect(mermaid).toContain("graph LR");
    expect(mermaid).toContain("express@4.21.2");
    expect(mermaid).toContain("qs@6.5.2");
    expect(mermaid).toContain("-->");
    expect(mermaid).toContain("style");
  });
});
