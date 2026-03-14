import type { Database } from "bun:sqlite";

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS _meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS packuments (
  ecosystem  TEXT NOT NULL DEFAULT 'npm',
  name       TEXT NOT NULL,
  hash       TEXT NOT NULL,
  data       TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  PRIMARY KEY (ecosystem, name)
);
CREATE INDEX IF NOT EXISTS idx_packuments_hash ON packuments (hash);

CREATE TABLE IF NOT EXISTS packages (
  ecosystem        TEXT NOT NULL DEFAULT 'npm',
  name             TEXT NOT NULL,
  version          TEXT NOT NULL,
  hash             TEXT NOT NULL,
  license          TEXT,
  license_category TEXT NOT NULL,
  dependencies     TEXT NOT NULL,
  resolved_at      INTEGER NOT NULL,
  PRIMARY KEY (ecosystem, name, version)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_packages_hash ON packages (hash);

CREATE TABLE IF NOT EXISTS vulnerabilities (
  ecosystem  TEXT NOT NULL DEFAULT 'npm',
  name       TEXT NOT NULL,
  version    TEXT NOT NULL,
  hash       TEXT NOT NULL,
  vulns      TEXT NOT NULL,
  vuln_count INTEGER NOT NULL,
  scanned_at INTEGER NOT NULL,
  PRIMARY KEY (ecosystem, name, version)
);
CREATE INDEX IF NOT EXISTS idx_vulns_hash ON vulnerabilities (hash);
CREATE INDEX IF NOT EXISTS idx_vulns_scanned ON vulnerabilities (scanned_at);
`;

const MIGRATION_V2 = `
ALTER TABLE packages ADD COLUMN license_file_checked INTEGER NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN license_file_spdx TEXT;
`;

export function runMigrations(db: Database): void {
  const currentVersion = getSchemaVersion(db);

  if (currentVersion < 1) {
    db.exec(SCHEMA_V1);
    setSchemaVersion(db, 2); // New installs go straight to v2
    // Apply v2 columns on fresh schema too
    try {
      db.exec(MIGRATION_V2);
    } catch {
      // Columns already exist in fresh schema context - ignore
    }
    return;
  }

  if (currentVersion < 2) {
    try {
      db.exec(MIGRATION_V2);
    } catch {
      // Columns may already exist
    }
    setSchemaVersion(db, 2);
  }
}

function getSchemaVersion(db: Database): number {
  try {
    // _meta might not exist yet
    const row = db.query("SELECT value FROM _meta WHERE key = 'schema_version'").get() as { value: string } | null;
    return row ? parseInt(row.value, 10) : 0;
  } catch {
    return 0;
  }
}

function setSchemaVersion(db: Database, version: number): void {
  db.run(
    "INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', ?)",
    [String(version)],
  );
}
