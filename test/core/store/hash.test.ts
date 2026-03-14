import { describe, expect, test } from "bun:test";
import { packageHash, packumentHash } from "../../../src/core/store/hash.js";

describe("packageHash", () => {
  test("produces deterministic output", () => {
    const h1 = packageHash("npm", "express", "4.21.2");
    const h2 = packageHash("npm", "express", "4.21.2");
    expect(h1).toBe(h2);
  });

  test("produces 32-character hex string", () => {
    const h = packageHash("npm", "lodash", "4.17.21");
    expect(h).toHaveLength(32);
    expect(h).toMatch(/^[0-9a-f]{32}$/);
  });

  test("different versions produce different hashes", () => {
    const h1 = packageHash("npm", "express", "4.21.2");
    const h2 = packageHash("npm", "express", "4.21.1");
    expect(h1).not.toBe(h2);
  });

  test("different ecosystems produce different hashes", () => {
    const h1 = packageHash("npm", "express", "4.21.2");
    const h2 = packageHash("pypi", "express", "4.21.2");
    expect(h1).not.toBe(h2);
  });

  test("handles scoped packages", () => {
    const h = packageHash("npm", "@types/node", "20.0.0");
    expect(h).toHaveLength(32);
    expect(h).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("packumentHash", () => {
  test("produces deterministic output", () => {
    const h1 = packumentHash("npm", "express");
    const h2 = packumentHash("npm", "express");
    expect(h1).toBe(h2);
  });

  test("differs from packageHash", () => {
    const ph = packumentHash("npm", "express");
    const pkgH = packageHash("npm", "express", "4.21.2");
    expect(ph).not.toBe(pkgH);
  });
});
