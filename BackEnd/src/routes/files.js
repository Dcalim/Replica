const express = require("express");
const { scanForDuplicates } = require("../services/scanDuplicates");

const router = express.Router();

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
    if (err.code === "ENOENT") {
      return res.status(400).json({ error: "Directory does not exist." });
    }
    if (err.code === "EACCES" || err.code === "EPERM") {
      return res.status(403).json({ error: "Permission denied for directory." });
    }
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
