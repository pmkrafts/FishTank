import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "local-storage");
const DB_PATH = path.join(DB_DIR, "fishtank.sqlite");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

export const localDb = new (class {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.exec(`
      CREATE TABLE IF NOT EXISTS fish (
        id TEXT PRIMARY KEY,
        r2_key TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        x REAL DEFAULT 0.5,
        y REAL DEFAULT 0.5,
        rotation REAL DEFAULT 0,
        shape_type TEXT NOT NULL,
        text_label TEXT,
        text_color TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_fish_expires ON fish(expires_at);
      CREATE INDEX IF NOT EXISTS idx_fish_fingerprint ON fish(fingerprint);
      CREATE INDEX IF NOT EXISTS idx_fish_created ON fish(created_at);
    `);
  }

  exec(sql: string) {
    this.db.exec(sql);
  }

  prepare(sql: string) {
    return new LocalStatement(this.db, sql);
  }
})();

class LocalStatement {
  constructor(
    private db: DatabaseSync,
    private sql: string
  ) {}

  bind(...params: unknown[]) {
    return new BoundStatement(this.db, this.sql, params);
  }

  all<T = unknown>() {
    return new BoundStatement(this.db, this.sql, []).all<T>();
  }

  first<T = unknown>() {
    return new BoundStatement(this.db, this.sql, []).first<T>();
  }

  run() {
    return new BoundStatement(this.db, this.sql, []).run();
  }
}

class BoundStatement {
  constructor(
    private db: DatabaseSync,
    private sql: string,
    private params: unknown[]
  ) {}

  all<T = unknown>(): { results: T[] } {
    const stmt = this.db.prepare(this.sql);
    const rows: T[] = [];
    for (const row of stmt.iterate(...(this.params as (string | number | null)[]))) {
      rows.push(row as T);
    }
    return { results: rows };
  }

  first<T = unknown>(): T | null {
    const rows = this.all<T>().results;
    return rows[0] ?? null;
  }

  run(): { meta: { rows_written: number } } {
    const stmt = this.db.prepare(this.sql);
    const info = stmt.run(...(this.params as (string | number | null)[]));
    return { meta: { rows_written: info.changes } };
  }
}
