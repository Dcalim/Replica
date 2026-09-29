const { getDb } = require("./index");

function createScan(directory) {
  const result = getDb()
    .prepare(
      `INSERT INTO scans (directory, started_at, status)
       VALUES (?, ?, 'running')`,
    )
    .run(directory, new Date().toISOString());

  return Number(result.lastInsertRowid);
}

function completeScan(scanId, stats) {
  getDb()
    .prepare(
      `UPDATE scans
       SET completed_at = ?,
           scanned_files = ?,
           duplicate_groups = ?,
           reclaimable_bytes = ?,
           status = 'completed'
       WHERE id = ?`,
    )
    .run(
      new Date().toISOString(),
      stats.scannedFiles,
      stats.duplicateGroups,
      stats.reclaimableBytes,
      scanId,
    );
}

function failScan(scanId) {
  getDb()
    .prepare(
      `UPDATE scans
       SET completed_at = ?,
           status = 'failed'
       WHERE id = ?`,
    )
    .run(new Date().toISOString(), scanId);
}

function listScans() {
  return getDb()
    .prepare(
      `SELECT
         s.id,
         s.directory,
         s.started_at AS startedAt,
         s.completed_at AS completedAt,
         s.scanned_files AS scannedFiles,
         s.duplicate_groups AS duplicateGroups,
         s.reclaimable_bytes AS reclaimableBytes,
         s.status,
         (
           SELECT COUNT(*)
           FROM deleted_files d
           WHERE d.scan_id = s.id
         ) AS deletedCount
       FROM scans s
       ORDER BY s.started_at DESC`,
    )
    .all();
}

function upsertFileIndexEntries(scanId, entries) {
  const upsert = getDb().prepare(
    `INSERT INTO file_index (path, size, mtime_ms, hash, last_seen_at, last_scan_id)
     VALUES (@path, @size, @mtimeMs, @hash, @lastSeenAt, @lastScanId)
     ON CONFLICT(path) DO UPDATE SET
       size = excluded.size,
       mtime_ms = excluded.mtime_ms,
       hash = excluded.hash,
       last_seen_at = excluded.last_seen_at,
       last_scan_id = excluded.last_scan_id`,
  );

  const runAll = getDb().transaction((rows) => {
    for (const row of rows) {
      upsert.run(row);
    }
  });

  runAll(entries);
}

function getFileIndexByPath(filePath) {
  return (
    getDb()
      .prepare(
        `SELECT path, size, mtime_ms AS mtimeMs, hash, last_scan_id AS lastScanId
         FROM file_index
         WHERE path = ?`,
      )
      .get(filePath) ?? null
  );
}

function createFileIndexLookup() {
  const statement = getDb().prepare(
    `SELECT size, mtime_ms AS mtimeMs, hash
     FROM file_index
     WHERE path = ?`,
  );

  return (filePath) => statement.get(filePath) ?? null;
}

function removeFileIndex(filePath) {
  getDb().prepare(`DELETE FROM file_index WHERE path = ?`).run(filePath);
}

module.exports = {
  createScan,
  completeScan,
  failScan,
  listScans,
  upsertFileIndexEntries,
  getFileIndexByPath,
  createFileIndexLookup,
  removeFileIndex,
};
