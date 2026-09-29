const fs = require("fs/promises");
const path = require("path");
const { createReadStream } = require("fs");
const crypto = require("crypto");
const {
  createScan,
  completeScan,
  failScan,
  upsertFileIndexEntries,
  getFileIndexByPath,
  createFileIndexLookup,
  removeFileIndex,
} = require("../db/scans");
const {
  createDeletedFile,
  updateRecoveryPath,
} = require("../db/deletedFiles");
const { getRecoveryPath } = require("../db");
const { pruneExpiredHistory } = require("./settings");

async function walkFiles(rootDir, callbacks = {}) {
  const { onFile, onFolder } = callbacks;
  const files = [];
  let folderCount = 0;

  async function walk(currentDir) {
    let entries;

    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    folderCount += 1;
    onFolder?.(folderCount);

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
        onFile?.(files.length);
      }
    }
  }

  await walk(rootDir);
  return files;
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function emitProgress(onProgress, payload) {
  onProgress?.(payload);
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

async function scanForDuplicates(directory, onProgress) {
  const rootDir = path.resolve(directory);
  const stat = await fs.stat(rootDir);

  if (!stat.isDirectory()) {
    const error = new Error("Path is not a directory.");
    error.status = 400;
    throw error;
  }

  const scanId = createScan(rootDir);

  try {
    emitProgress(onProgress, {
      phase: "discovering",
      current: 0,
      total: null,
      unit: "folders",
    });

    const allFiles = await walkFiles(rootDir, {
      onFolder: (folderCount) => {
        emitProgress(onProgress, {
          phase: "discovering",
          current: folderCount,
          total: null,
          unit: "folders",
        });
      },
      onFile: (fileCount) => {
        if (fileCount % 25 === 0 || fileCount === 1) {
          emitProgress(onProgress, {
            phase: "discovering",
            current: fileCount,
            total: null,
            unit: "files",
          });
        }
      },
    });

    emitProgress(onProgress, {
      phase: "discovering",
      current: allFiles.length,
      total: allFiles.length,
      unit: "files",
    });

    const bySize = new Map();
    const fileMeta = new Map();

    for (const filePath of allFiles) {
      let fileStat;

      try {
        fileStat = await fs.stat(filePath);
      } catch {
        continue;
      }

      const size = fileStat.size;
      fileMeta.set(filePath, {
        size,
        mtimeMs: Math.trunc(fileStat.mtimeMs),
      });

      if (!bySize.has(size)) {
        bySize.set(size, []);
      }

      bySize.get(size).push(filePath);
    }

    const filesToHash = [...bySize.values()]
      .filter((sameSizeFiles) => sameSizeFiles.length >= 2)
      .reduce((total, sameSizeFiles) => total + sameSizeFiles.length, 0);

    emitProgress(onProgress, {
      phase: "hashing",
      current: 0,
      total: filesToHash,
      unit: "files",
    });

    const hashGroups = new Map();
    const indexEntries = [];
    const seenAt = new Date().toISOString();
    const lookupIndexedFile = createFileIndexLookup();
    let hashedCount = 0;
    let reusedHashes = 0;
    let computedHashes = 0;

    for (const [size, sameSizeFiles] of bySize) {
      if (sameSizeFiles.length < 2) {
        continue;
      }

      for (const filePath of sameSizeFiles) {
        const meta = fileMeta.get(filePath);
        const mtimeMs = meta?.mtimeMs ?? 0;
        const cached = lookupIndexedFile(filePath);
        let hash;

        // Size is compared too: filesystems with coarse mtime (FAT, some network drives)
        // can keep the same mtime across a quick rewrite.
        if (
          cached?.hash &&
          cached.mtimeMs === mtimeMs &&
          cached.size === size
        ) {
          hash = cached.hash;
          reusedHashes += 1;
        } else {
          try {
            hash = await hashFile(filePath);
          } catch {
            continue;
          }

          computedHashes += 1;
        }

        hashedCount += 1;
        emitProgress(onProgress, {
          phase: "hashing",
          current: hashedCount,
          total: filesToHash,
          unit: "files",
        });

        indexEntries.push({
          path: filePath,
          size,
          mtimeMs,
          hash,
          lastSeenAt: seenAt,
          lastScanId: scanId,
        });

        const key = `${size}:${hash}`;

        if (!hashGroups.has(key)) {
          hashGroups.set(key, { hash, size, files: [] });
        }

        hashGroups.get(key).files.push(filePath);
      }
    }

    if (indexEntries.length > 0) {
      upsertFileIndexEntries(scanId, indexEntries);
    }

    const duplicates = [...hashGroups.values()].filter(
      (group) => group.files.length >= 2,
    );

    const reclaimableBytes = duplicates.reduce(
      (total, group) => total + group.size * (group.files.length - 1),
      0,
    );

    const result = {
      scanId,
      directory: rootDir,
      scannedFiles: allFiles.length,
      files: allFiles,
      duplicateGroups: duplicates.length,
      reclaimableBytes,
      reusedHashes,
      computedHashes,
      duplicates,
    };

    completeScan(scanId, result);
    pruneExpiredHistory();
    return result;
  } catch (error) {
    failScan(scanId);
    throw error;
  }
}

/**
 * Move selected duplicate files into the app recovery folder and log them.
 */
async function deleteDuplicates(files, scanId = null) {
  const deleted = [];
  const recoveryRoot = getRecoveryPath();

  await fs.mkdir(recoveryRoot, { recursive: true });

  for (const file of files) {
    if (typeof file !== "string" || file.trim() === "") {
      const error = new Error("Each file path must be a non-empty string.");
      error.status = 400;
      throw error;
    }

    const resolvedPath = path.resolve(file);
    const stat = await fs.stat(resolvedPath);

    if (!stat.isFile()) {
      const error = new Error(`Path is not a file: ${resolvedPath}`);
      error.status = 400;
      throw error;
    }

    const indexed = getFileIndexByPath(resolvedPath);
    const deletedId = createDeletedFile({
      originalPath: resolvedPath,
      size: stat.size,
      hash: indexed?.hash ?? null,
      scanId,
      recoveryPath: null,
    });

    const recoveryPath = path.join(
      recoveryRoot,
      String(deletedId),
      path.basename(resolvedPath),
    );

    await moveFileSafely(resolvedPath, recoveryPath);
    updateRecoveryPath(deletedId, recoveryPath);
    removeFileIndex(resolvedPath);

    deleted.push({
      id: deletedId,
      originalPath: resolvedPath,
      recoveryPath,
    });
  }

  return {
    deleted: deleted.length,
    files: deleted.map((entry) => entry.originalPath),
  };
}

module.exports = { scanForDuplicates, deleteDuplicates };
