// Import promise-based file system methods (async/await friendly)
const fs = require("fs/promises");

// Helps handle file paths across OS (Windows/Mac/Linux)
const path = require("path");

// Used to create hashes (fingerprints of file content)
const crypto = require("crypto");

// Used to stream file data (better for large files than reading all at once)
const { createReadStream } = require("fs");


// 🔍 Recursively walk through a directory and collect ALL file paths
async function walkFiles(rootDir, callbacks = {}) {
  const { onFile, onFolder } = callbacks;
  const files = [];
  let folderCount = 0;

  // Inner recursive function
  async function walk(currentDir) {
    let entries;

    try {
      // Read directory contents (files + folders)
      // withFileTypes gives us info like "isFile", "isDirectory"
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      // If we can't access a directory (permissions, etc.), skip it
      return;
    }

    folderCount += 1;
    onFolder?.(folderCount);

    for (const entry of entries) {
      // Build full path (important for nested folders)
      const fullPath = path.join(currentDir, entry.name);

      // Skip symbolic links (can cause infinite loops)
      if (entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory()) {
        // If it's a folder → recurse into it
        await walk(fullPath);
      } else if (entry.isFile()) {
        // If it's a file → store it
        files.push(fullPath);
        onFile?.(files.length);
      }
    }
  }

  // Start recursion from root
  await walk(rootDir);

  return files;
}


// 🔐 Create a SHA256 hash of a file's CONTENT
function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    // Create hash object
    const hash = crypto.createHash("sha256");

    // Stream file instead of loading entire file into memory
    const stream = createReadStream(filePath);

    // For each chunk of data → update hash
    stream.on("data", (chunk) => hash.update(chunk));

    // When done → output final hash as hex string
    stream.on("end", () => resolve(hash.digest("hex")));

    // Handle errors (file unreadable, etc.)
    stream.on("error", reject);
  });
}

function emitProgress(onProgress, payload) {
  onProgress?.(payload);
}


// 🚀 MAIN FUNCTION: scans a directory for duplicate files
async function scanForDuplicates(directory, onProgress) {

  // Convert to absolute path (safer + consistent)
  const rootDir = path.resolve(directory);

  // Check if path exists and is valid
  const stat = await fs.stat(rootDir);

  if (!stat.isDirectory()) {
    const error = new Error("Path is not a directory.");
    error.status = 400;
    throw error;
  }

  emitProgress(onProgress, {
    phase: "discovering",
    current: 0,
    total: null,
    unit: "folders",
  });

  // 🔍 Step 1: Get ALL files recursively
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

  // 🧠 Step 2: Group files by SIZE first (optimization)
  // Why? Files with different sizes can NEVER be duplicates
  const bySize = new Map();

  for (const filePath of allFiles) {
    let fileStat;

    try {
      fileStat = await fs.stat(filePath);
    } catch {
      // Skip unreadable files
      continue;
    }

    const size = fileStat.size;

    // Initialize array if size not seen before
    if (!bySize.has(size)) {
      bySize.set(size, []);
    }

    // Add file to its size group
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

  // 🧠 Step 3: Hash only files that share the same size
  // This avoids unnecessary hashing (big performance win)
  const hashGroups = new Map();
  let hashedCount = 0;

  for (const [size, sameSizeFiles] of bySize) {

    // If only 1 file of this size → cannot be duplicate
    if (sameSizeFiles.length < 2) {
      continue;
    }

    for (const filePath of sameSizeFiles) {
      let hash;

      try {
        // Generate content hash
        hash = await hashFile(filePath);
      } catch {
        // Skip files that fail hashing
        continue;
      }

      hashedCount += 1;
      emitProgress(onProgress, {
        phase: "hashing",
        current: hashedCount,
        total: filesToHash,
        unit: "files",
      });

      // Combine size + hash to form unique key
      const key = `${size}:${hash}`;

      // Initialize group if needed
      if (!hashGroups.has(key)) {
        hashGroups.set(key, { hash, size, files: [] });
      }

      // Add file to this duplicate group
      hashGroups.get(key).files.push(filePath);
    }
  }

  // 🧹 Step 4: Keep only groups with actual duplicates (2+ files)
  const duplicates = [...hashGroups.values()].filter(
    (group) => group.files.length >= 1
  );

  // 💾 Step 5: Calculate how much space can be recovered
  // (keep 1 file, delete the rest)
  const reclaimableBytes = duplicates.reduce(
    (total, group) =>
      total + group.size * (group.files.length - 1),
    0
  );

  // 📦 Final result returned to frontend
  return {
    directory: rootDir,
    scannedFiles: allFiles.length,
    files: allFiles,
    duplicateGroups: duplicates.length,
    reclaimableBytes,
    duplicates,
  };
}


// Export function so it can be used in your API
module.exports = { scanForDuplicates };
