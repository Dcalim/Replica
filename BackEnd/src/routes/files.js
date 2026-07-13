const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const { createReadStream } = require("fs");
const { scanForDuplicates } = require("../services/scanDuplicates");

const router = express.Router();

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".heic",
  ".heif",
]);

const PREVIEW_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ".pdf"]);

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".pdf": "application/pdf",
};

const MAX_PREVIEW_BYTES = 20 * 1024 * 1024;

function handleScanError(err, res, next) {
  if (err.code === "ENOENT") {
    return res.status(400).json({ error: "Directory does not exist." });
  }
  if (err.code === "EACCES" || err.code === "EPERM") {
    return res.status(403).json({ error: "Permission denied for directory." });
  }
  if (err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
}

router.post("/scan", async (req, res, next) => {
  const { directory } = req.body;

  // Validate the directory path
  if (!directory || typeof directory !== "string") {
    return res.status(400).json({
      error: "A directory path is required in the request body.",
    });
  }

  try {
    const result = await scanForDuplicates(directory);
    res.json(result);
  } catch (err) {
    return handleScanError(err, res, next);
  }
});

router.post("/scan/stream", async (req, res, next) => {
  const { directory } = req.body;

  if (!directory || typeof directory !== "string") {
    return res.status(400).json({
      error: "A directory path is required in the request body.",
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendEvent = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const result = await scanForDuplicates(directory, (progress) => {
      sendEvent(progress);
    });

    sendEvent({ type: "complete", result });
    res.end();
  } catch (err) {
    if (err.code === "ENOENT") {
      sendEvent({ type: "error", error: "Directory does not exist." });
      return res.end();
    }
    if (err.code === "EACCES" || err.code === "EPERM") {
      sendEvent({ type: "error", error: "Permission denied for directory." });
      return res.end();
    }
    if (err.status === 400) {
      sendEvent({ type: "error", error: err.message });
      return res.end();
    }

    return handleScanError(err, res, next);
  }
});

router.get("/preview", async (req, res, next) => {
  const filePath = req.query.path;

  if (!filePath || typeof filePath !== "string") {
    return res.status(400).json({ error: "A file path is required." });
  }

  const resolvedPath = path.resolve(filePath);
  const extension = path.extname(resolvedPath).toLowerCase();

  if (!PREVIEW_EXTENSIONS.has(extension)) {
    return res.status(400).json({ error: "Preview is only available for image and PDF files." });
  }

  try {
    const stat = await fs.stat(resolvedPath);

    if (!stat.isFile()) {
      return res.status(400).json({ error: "Path is not a file." });
    }

    if (stat.size > MAX_PREVIEW_BYTES) {
      return res.status(400).json({ error: "File is too large to preview." });
    }

    res.setHeader("Content-Type", MIME_TYPES[extension] ?? "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=3600");

    createReadStream(resolvedPath).pipe(res);
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "File does not exist." });
    }
    if (err.code === "EACCES" || err.code === "EPERM") {
      return res.status(403).json({ error: "Permission denied for file." });
    }

    return next(err);
  }
});

module.exports = router;
