import type { LicenseCategory } from "../graph/types.js";

export interface LicenseComponent {
  spdxId: string;
  category: LicenseCategory;
}

export function parseLicenseComponents(expr: string): LicenseComponent[] {
  const normalized = expr.trim();
  if (!normalized) return [];

  // Split on OR or AND
  const separator = normalized.includes(" OR ")
    ? " OR "
    : normalized.includes(" AND ")
      ? " AND "
      : null;

  if (!separator) {
    return [{ spdxId: normalized, category: classifyLicense(normalized) }];
  }

  return normalized
    .split(separator)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((spdxId) => ({ spdxId, category: classifyLicense(spdxId) }));
}

const PERMISSIVE_LICENSES = new Set([
  "MIT",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "Unlicense",
  "CC0-1.0",
  "0BSD",
  "BlueOak-1.0.0",
  "Artistic-2.0",
  "Zlib",
  "PSF-2.0",
  "Python-2.0",
  "X11",
  "CC-BY-3.0",
  "CC-BY-4.0",
  "BSL-1.0",
  "W3C",
]);

const COPYLEFT_LICENSES = new Set([
  "GPL-2.0",
  "GPL-2.0-only",
  "GPL-2.0-or-later",
  "GPL-3.0",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
  "AGPL-3.0",
  "AGPL-3.0-only",
  "AGPL-3.0-or-later",
  "EUPL-1.1",
  "EUPL-1.2",
  "SSPL-1.0",
  "OSL-3.0",
]);

const WEAK_COPYLEFT_LICENSES = new Set([
  "LGPL-2.0",
  "LGPL-2.0-only",
  "LGPL-2.0-or-later",
  "LGPL-2.1",
  "LGPL-2.1-only",
  "LGPL-2.1-or-later",
  "LGPL-3.0",
  "LGPL-3.0-only",
  "LGPL-3.0-or-later",
  "MPL-2.0",
  "EPL-1.0",
  "EPL-2.0",
  "CDDL-1.0",
  "CDDL-1.1",
  "CPL-1.0",
]);

export function classifyLicense(spdxId: string): LicenseCategory {
  const normalized = spdxId.trim();

  if (PERMISSIVE_LICENSES.has(normalized)) return "permissive";
  if (COPYLEFT_LICENSES.has(normalized)) return "copyleft";
  if (WEAK_COPYLEFT_LICENSES.has(normalized)) return "weak-copyleft";

  // Handle SPDX expressions with OR - classify by most permissive
  if (normalized.includes(" OR ")) {
    const parts = normalized.split(" OR ").map((p) => p.trim());
    const categories = parts.map(classifyLicense);
    if (categories.includes("permissive")) return "permissive";
    if (categories.includes("weak-copyleft")) return "weak-copyleft";
    if (categories.includes("copyleft")) return "copyleft";
  }

  // Handle SPDX expressions with AND - classify by most restrictive
  if (normalized.includes(" AND ")) {
    const parts = normalized.split(" AND ").map((p) => p.trim());
    const categories = parts.map(classifyLicense);
    if (categories.includes("copyleft")) return "copyleft";
    if (categories.includes("weak-copyleft")) return "weak-copyleft";
    if (categories.includes("permissive")) return "permissive";
  }

  return "unknown";
}
