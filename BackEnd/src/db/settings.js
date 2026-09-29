const { getDb } = require("./index");

function getSetting(key) {
  const row = getDb()
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(key);

  return row ? JSON.parse(row.value) : undefined;
}

function setSetting(key, value) {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, JSON.stringify(value));
}

/**
 * Removes scans started before the cutoff, plus hash cache entries not seen since then.
 * Recoverable deleted files are kept and detached from their scan so restore still works.
 */
function pruneHistoryBefore(cutoffIso) {
  const db = getDb();

  const run = db.transaction((cutoff) => {
    const expiredScans = `SELECT id FROM scans WHERE started_at < ? AND status != 'running'`;

    db.prepare(
      `UPDATE deleted_files SET scan_id = NULL WHERE scan_id IN (${expiredScans})`,
    ).run(cutoff);

    db.prepare(
      `UPDATE file_index SET last_scan_id = NULL WHERE last_scan_id IN (${expiredScans})`,
    ).run(cutoff);

    const removedRestored = db
      .prepare(
        `DELETE FROM deleted_files
         WHERE restored_at IS NOT NULL AND restored_at < ?`,
      )
      .run(cutoff).changes;

    const removedHashes = db
      .prepare(`DELETE FROM file_index WHERE last_seen_at < ?`)
      .run(cutoff).changes;

    const removedScans = db
      .prepare(`DELETE FROM scans WHERE started_at < ? AND status != 'running'`)
      .run(cutoff).changes;

    return { removedScans, removedHashes, removedRestored };
  });

  return run(cutoffIso);
}

module.exports = {
  getSetting,
  setSetting,
  pruneHistoryBefore,
};
