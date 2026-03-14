import type { LicenseCategory } from "../graph/types.js";

export interface LicenseInfo {
  spdxId: string | null;
  category: LicenseCategory;
  raw: string | null; // original value from package.json
}
