import type { VulnSource } from "../vulnerability/aggregator.js";

export interface VulnerabilityIgnoreRule {
  package: string;
  advisory: string;
  source?: VulnSource;
  versions?: string;
  reason?: string;
  expires?: string;
}

export interface AmiConfig {
  denyLicenses?: string[];
  allowLicenses?: string[]; // whitelist: anything not listed triggers a warning
  licenseOverrides?: Record<string, string>; // "pkg@version": "SPDX-ID"
  vulnerabilityIgnores?: VulnerabilityIgnoreRule[];
  failOnVuln?: string;
  failOnLicense?: string;
  depth?: number;
  concurrency?: number;
  deepLicenseCheck?: boolean;
  security?: boolean;
  excludePackages?: string[]; // exact names or wildcards (e.g., "@scope/*")
  npmToken?: string;
}
