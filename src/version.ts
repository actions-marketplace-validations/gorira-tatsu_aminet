import { readFileSync } from "node:fs";

function loadVersion(): string {
  try {
    const raw = readFileSync(new URL("../package.json", import.meta.url), "utf-8");
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === "string" ? parsed.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export const AMINET_VERSION = loadVersion();
