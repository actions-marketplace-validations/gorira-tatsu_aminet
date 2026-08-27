import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { validateConfigCommand } from "../../../src/cli/commands/validate-config.js";

describe("validateConfigCommand", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "aminet-validate-config-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  test("prints success for a valid config", async () => {
    const configPath = join(tempRoot, "aminet.config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        vulnerabilityIgnores: [
          {
            package: "serve",
            advisory: "GHSA-48gc-5j93-5cfq",
            reason: "Not affected in fixed serve releases.",
            expires: "2099-01-01",
          },
        ],
      }),
    );

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    validateConfigCommand(configPath);

    expect(logSpy.mock.calls.map(([value]) => String(value)).join("\n")).toContain(
      "Config is valid:",
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("exits non-zero for an invalid config", async () => {
    const configPath = join(tempRoot, "aminet.config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        vulnerabilityIgnores: [{ package: "serve", advisory: "", reason: "" }],
      }),
    );

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(async () => validateConfigCommand(configPath)).rejects.toThrow("process.exit:1");
    expect(errorSpy.mock.calls.map(([value]) => String(value)).join("\n")).toContain(
      "$.vulnerabilityIgnores[0].advisory",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
