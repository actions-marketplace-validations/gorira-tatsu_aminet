import { describe, expect, test } from "vitest";
import { validateConfig } from "../../../src/core/config/validator.js";

describe("validateConfig", () => {
  test("accepts a valid vulnerability ignore rule", () => {
    const issues = validateConfig(
      {
        vulnerabilityIgnores: [
          {
            package: "serve",
            advisory: "GHSA-48gc-5j93-5cfq",
            source: "ghsa",
            versions: ">= 14.0.0",
            reason: "Not affected in fixed serve releases.",
            expires: "2099-01-01",
          },
        ],
      },
      new Date("2026-06-17T00:00:00Z"),
    );

    expect(issues).toEqual([]);
  });

  test("reports invalid vulnerability ignore rules", () => {
    const issues = validateConfig(
      {
        failOnVuln: "urgent",
        vulnerabilityIgnores: [
          {
            package: "",
            advisory: "GHSA-48gc-5j93-5cfq",
            source: "github",
            versions: "not a range",
            reason: "",
            expires: "2024-01-01",
          },
        ],
      },
      new Date("2026-06-17T00:00:00Z"),
    );

    expect(issues.filter((issue) => issue.severity === "error").map((issue) => issue.path)).toEqual(
      [
        "$.failOnVuln",
        "$.vulnerabilityIgnores[0].package",
        "$.vulnerabilityIgnores[0].reason",
        "$.vulnerabilityIgnores[0].source",
        "$.vulnerabilityIgnores[0].versions",
        "$.vulnerabilityIgnores[0].expires",
      ],
    );
  });

  test("warns when a vulnerability ignore has no expiry", () => {
    const issues = validateConfig({
      vulnerabilityIgnores: [
        {
          package: "path-to-regexp",
          advisory: "GHSA-9wv6-86v2-598j",
          reason: "Temporary operational suppression.",
        },
      ],
    });

    expect(issues).toEqual([
      {
        severity: "warning",
        path: "$.vulnerabilityIgnores[0].expires",
        message: "Add an expires date so suppressions are reviewed periodically.",
      },
    ]);
  });
});
