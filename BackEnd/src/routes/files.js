const express = require("express");
const { scanForDuplicates } = require("../services/scanDuplicates");

const router = express.Router();

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

module.exports = router;
