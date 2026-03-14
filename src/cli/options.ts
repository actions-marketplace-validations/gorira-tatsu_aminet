export interface AnalyzeOptions {
  json?: boolean;
  tree?: boolean;
  dot?: boolean;
  mermaid?: boolean;
  depth?: number;
  concurrency?: number;
  dev?: boolean;
  verbose?: boolean;
  file?: boolean;
  noCache?: boolean;
  ci?: boolean;
  failOnVuln?: string;        // severity threshold: low/medium/high/critical
  failOnLicense?: string;     // category: copyleft/weak-copyleft
  denyLicense?: string;       // comma-separated SPDX IDs to deny
  notices?: boolean;           // output NOTICE/attribution list
  deepLicenseCheck?: boolean;  // verify LICENSE files from tarballs
}
