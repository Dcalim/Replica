const express = require("express");
const { getHistory, restoreDeletedFiles } = require("../services/history");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json(getHistory());
});

router.post("/restore", async (req, res, next) => {
  const { ids } = req.body ?? {};

  try {
    const result = await restoreDeletedFiles(ids);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }

    return next(err);
  }
});

module.exports = router;
