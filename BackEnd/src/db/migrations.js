/**
 * Sequential schema versions. Each function runs once, in order.
 * Add a new function when the schema needs to change — never edit an old one.
 */
const migrations = [
  (db) => {
    db.exec(`
      CREATE TABLE scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        directory TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        scanned_files INTEGER NOT NULL DEFAULT 0,
        duplicate_groups INTEGER NOT NULL DEFAULT 0,
        reclaimable_bytes INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'running'
          CHECK (status IN ('running', 'completed', 'failed'))
      );

      -- One row per absolute path. Rescans skip hashing when size + mtime match.
      CREATE TABLE file_index (
        path TEXT PRIMARY KEY,
        size INTEGER NOT NULL,
        mtime_ms INTEGER NOT NULL,
        hash TEXT,
        last_seen_at TEXT NOT NULL,
        last_scan_id INTEGER REFERENCES scans(id)
      );

      CREATE INDEX idx_file_index_hash_size ON file_index (hash, size);

      -- Files moved to Trash. Recovery UI reads this; restore is a later step.
      CREATE TABLE deleted_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_path TEXT NOT NULL,
        size INTEGER,
        hash TEXT,
        scan_id INTEGER REFERENCES scans(id),
        deleted_at TEXT NOT NULL,
        restored_at TEXT
      );

      CREATE INDEX idx_deleted_files_deleted_at ON deleted_files (deleted_at DESC);
    `);
  },
  (db) => {
    db.exec(`
      ALTER TABLE deleted_files ADD COLUMN recovery_path TEXT;
    `);
  },
  (db) => {
    db.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  },
];

module.exports = { migrations };
