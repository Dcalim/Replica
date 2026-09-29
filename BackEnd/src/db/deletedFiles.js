const { getDb } = require("./index");

function createDeletedFile({
  originalPath,
  size,
  hash,
  scanId,
  recoveryPath,
}) {
  const result = getDb()
    .prepare(
      `INSERT INTO deleted_files (
         original_path,
         size,
         hash,
         scan_id,
         deleted_at,
         recovery_path
       ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      originalPath,
      size,
      hash ?? null,
      scanId ?? null,
      new Date().toISOString(),
      recoveryPath ?? null,
    );

  return Number(result.lastInsertRowid);
}

function updateRecoveryPath(id, recoveryPath) {
  getDb()
    .prepare(`UPDATE deleted_files SET recovery_path = ? WHERE id = ?`)
    .run(recoveryPath, id);
}

function listDeletedFiles() {
  return getDb()
    .prepare(
      `SELECT
         id,
         original_path AS originalPath,
         size,
         hash,
         scan_id AS scanId,
         deleted_at AS deletedAt,
         restored_at AS restoredAt,
         recovery_path AS recoveryPath
       FROM deleted_files
       ORDER BY deleted_at DESC`,
    )
    .all();
}

function getDeletedFilesByIds(ids) {
  if (!ids.length) {
    return [];
  }

  const placeholders = ids.map(() => "?").join(", ");

  return getDb()
    .prepare(
      `SELECT
         id,
         original_path AS originalPath,
         size,
         hash,
         scan_id AS scanId,
         deleted_at AS deletedAt,
         restored_at AS restoredAt,
         recovery_path AS recoveryPath
       FROM deleted_files
       WHERE id IN (${placeholders})`,
    )
    .all(...ids);
}

function markRestored(id) {
  getDb()
    .prepare(
      `UPDATE deleted_files
       SET restored_at = ?, recovery_path = NULL
       WHERE id = ?`,
    )
    .run(new Date().toISOString(), id);
}

module.exports = {
  createDeletedFile,
  updateRecoveryPath,
  listDeletedFiles,
  getDeletedFilesByIds,
  markRestored,
};
