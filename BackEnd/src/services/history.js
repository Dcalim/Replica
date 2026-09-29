const fs = require("fs/promises");
const path = require("path");
const { listScans } = require("../db/scans");
const {
  listDeletedFiles,
  getDeletedFilesByIds,
  markRestored,
} = require("../db/deletedFiles");

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function moveFileSafely(fromPath, toPath) {
  await fs.mkdir(path.dirname(toPath), { recursive: true });

  try {
    await fs.rename(fromPath, toPath);
  } catch (error) {
    if (error.code !== "EXDEV") {
      throw error;
    }

    await fs.copyFile(fromPath, toPath);
    await fs.unlink(fromPath);
  }
}

function getHistory() {
  const scans = listScans();
  const deletedFiles = listDeletedFiles().map((file) => ({
    ...file,
    canRestore: file.restoredAt == null && Boolean(file.recoveryPath),
  }));

  return { scans, deletedFiles };
}

async function restoreDeletedFiles(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    const error = new Error("A list of deleted file ids is required.");
    error.status = 400;
    throw error;
  }

  if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
    const error = new Error("Each deleted file id must be a positive integer.");
    error.status = 400;
    throw error;
  }

  const rows = getDeletedFilesByIds(ids);

  if (rows.length !== ids.length) {
    const error = new Error("One or more deleted files were not found.");
    error.status = 404;
    throw error;
  }

  const restored = [];

  for (const row of rows) {
    if (row.restoredAt) {
      const error = new Error(
        `File has already been restored: ${row.originalPath}`,
      );
      error.status = 400;
      throw error;
    }

    if (!row.recoveryPath) {
      const error = new Error(
        `No recovery copy is available for: ${row.originalPath}`,
      );
      error.status = 400;
      throw error;
    }

    if (!(await pathExists(row.recoveryPath))) {
      const error = new Error(
        `Recovery copy is missing for: ${row.originalPath}`,
      );
      error.status = 404;
      throw error;
    }

    if (await pathExists(row.originalPath)) {
      const error = new Error(
        `A file with that name already exists on your computer: ${row.originalPath}`,
      );
      error.status = 409;
      throw error;
    }

    await moveFileSafely(row.recoveryPath, row.originalPath);

    try {
      await fs.rmdir(path.dirname(row.recoveryPath));
    } catch {
      // Directory may still contain other files or already be gone.
    }

    markRestored(row.id);
    restored.push(row.originalPath);
  }

  return {
    restored: restored.length,
    files: restored,
  };
}

module.exports = {
  getHistory,
  restoreDeletedFiles,
};
