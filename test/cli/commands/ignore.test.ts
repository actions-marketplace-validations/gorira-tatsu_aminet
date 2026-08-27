import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ignoreAddCommand, ignoreListCommand } from "../../../src/cli/commands/ignore.js";

describe("ignore commands", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "aminet-ignore-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  test("adds a vulnerability ignore rule to a config file", async () => {
    const configPath = join(tempRoot, "aminet.config.json");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    ignoreAddCommand("serve", "GHSA-48gc-5j93-5cfq", {
      config: configPath,
      source: "ghsa",
      versions: ">= 14.0.0",
      reason: "Not affected in fixed serve releases.",
      expires: "2099-01-01",
    });

    const config = JSON.parse(await readFile(configPath, "utf-8"));
    expect(config.vulnerabilityIgnores).toEqual([
      {
        package: "serve",
        advisory: "GHSA-48gc-5j93-5cfq",
        source: "ghsa",
        versions: ">= 14.0.0",
        reason: "Not affected in fixed serve releases.",
        expires: "2099-01-01",
      },
    ]);
    expect(logSpy.mock.calls.map(([value]) => String(value)).join("\n")).toContain(
      "Added vulnerability ignore",
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("does not add duplicate vulnerability ignore rules", async () => {
    const configPath = join(tempRoot, "aminet.config.json");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    ignoreAddCommand("serve", "GHSA-48gc-5j93-5cfq", {
      config: configPath,
      reason: "Initial suppression.",
      expires: "2099-01-01",
    });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Added vulnerability ignore"));

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(async () =>
      ignoreAddCommand("serve", "GHSA-48gc-5j93-5cfq", {
        config: configPath,
        reason: "Duplicate suppression.",
        expires: "2099-01-01",
      }),
    ).rejects.toThrow("process.exit:1");

    expect(errorSpy.mock.calls.map(([value]) => String(value)).join("\n")).toContain(
      "already exists",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test("lists configured vulnerability ignore rules", async () => {
    const configPath = join(tempRoot, "nested", "aminet.config.json");
    await mkdir(join(tempRoot, "nested"), { recursive: true });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    ignoreAddCommand("path-to-regexp", "GHSA-9wv6-86v2-598j", {
      config: configPath,
      versions: "3.3.0",
      reason: "First patched version.",
      expires: "2099-01-01",
    });
    logSpy.mockClear();

    ignoreListCommand({ config: configPath });

    const output = logSpy.mock.calls.map(([value]) => String(value)).join("\n");
    expect(output).toContain("path-to-regexp GHSA-9wv6-86v2-598j");
    expect(output).toContain("versions=3.3.0");
    expect(output).toContain("reason: First patched version.");
  });
});
