const express = require("express");
const { getSettings, updateSettings } = require("../services/settings");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json(getSettings());
});

router.put("/", (req, res, next) => {
  try {
    res.json(updateSettings(req.body));
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }

    return next(err);
  }
});

module.exports = router;
