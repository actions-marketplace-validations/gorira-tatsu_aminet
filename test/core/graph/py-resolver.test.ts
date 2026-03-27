import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("py-resolver", () => {
  it("fetches latest metadata for root range specifiers", async () => {
    const getPyPIPackage = vi.fn(async (name: string, version?: string) => ({
      info: {
        name,
        version: version ?? "9.9.9",
        license: "MIT",
        summary: "",
        requires_dist: null,
        classifiers: [],
        home_page: null,
        author: null,
      },
    }));

    vi.doMock("../../../src/core/registry/pypi-client.js", () => ({
      getPyPIPackage,
      extractLicenseFromPyPI: () => "MIT",
      parsePep508: vi.fn(),
    }));

    const { resolvePythonDependencyGraph } = await import("../../../src/core/graph/py-resolver.js");

    await resolvePythonDependencyGraph("django", ">=4.0,<5.0");

    expect(getPyPIPackage).toHaveBeenCalledWith("django");
    expect(getPyPIPackage).not.toHaveBeenCalledWith("django", ">=4.0,<5.0");
  });

  it("skips direct-reference dependencies instead of resolving latest PyPI metadata", async () => {
    const getPyPIPackage = vi.fn(async (name: string, version?: string) => ({
      info: {
        name,
        version: version ?? "1.0.0",
        license: "MIT",
        summary: "",
        requires_dist: ["demo @ https://example.com/demo-1.0.0.tar.gz"],
        classifiers: [],
        home_page: null,
        author: null,
      },
    }));

    vi.doMock("../../../src/core/registry/pypi-client.js", () => ({
      getPyPIPackage,
      extractLicenseFromPyPI: () => "MIT",
      parsePep508: (spec: string) => {
        if (spec.startsWith("demo @ ")) {
          return {
            name: "demo",
            versionSpec: "@ https://example.com/demo-1.0.0.tar.gz",
            hasMarker: false,
          };
        }
        return null;
      },
    }));

    const { resolvePythonDependencyGraph } = await import("../../../src/core/graph/py-resolver.js");

    const graph = await resolvePythonDependencyGraph("rootpkg", "latest");

    expect(getPyPIPackage).toHaveBeenCalledTimes(1);
    expect(graph.nodes.size).toBe(1);
    expect(graph.edges).toHaveLength(0);
  });
});
