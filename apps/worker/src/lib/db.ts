export async function ensureSchema(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS fish (
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
      )`
    )
    .run();

  await db
    .prepare(`CREATE INDEX IF NOT EXISTS idx_fish_expires ON fish(expires_at)`)
    .run();
  await db
    .prepare(`CREATE INDEX IF NOT EXISTS idx_fish_fingerprint ON fish(fingerprint)`)
    .run();
  await db
    .prepare(`CREATE INDEX IF NOT EXISTS idx_fish_created ON fish(created_at)`)
    .run();
}
