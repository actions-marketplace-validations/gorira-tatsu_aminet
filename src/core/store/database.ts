import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { logger } from "../../utils/logger.js";
import { createDatabase, type DatabaseLike } from "./adapter.js";
import { runMigrations } from "./migrations.js";

const DB_DIR = join(homedir(), ".aminet");
const DB_PATH = join(DB_DIR, "aminet.db");

let instance: DatabaseLike | null = null;

/** Get or create the singleton database connection */
export function getDatabase(dbPath?: string): DatabaseLike {
  if (instance) return instance;

  const path = dbPath ?? DB_PATH;

  if (path !== ":memory:") {
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true });
    }
  }

  logger.debug(`Opening database: ${path}`);
  const db = createDatabase(path);

  // Performance optimizations
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA cache_size = -64000"); // 64MB
  db.exec("PRAGMA busy_timeout = 5000");

  runMigrations(db);

  instance = db;
  return db;
}

/** Close and reset the singleton (for testing) */
export function closeDatabase(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}

/** Reset singleton without closing (for test DI) */
export function setDatabase(db: DatabaseLike): void {
  instance = db;
}
