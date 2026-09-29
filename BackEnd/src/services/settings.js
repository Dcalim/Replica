const { getSetting, setSetting, pruneHistoryBefore } = require("../db/settings");

const SCAN_RETENTION_KEY = "scanRetentionDays";
const SCAN_RETENTION_OPTIONS = [7, 30, 90, 180, 365, null];
const DAY_MS = 24 * 60 * 60 * 1000;

function getSettings() {
  const scanRetentionDays = getSetting(SCAN_RETENTION_KEY);

  return {
    scanRetentionDays: scanRetentionDays === undefined ? null : scanRetentionDays,
    scanRetentionOptions: SCAN_RETENTION_OPTIONS,
  };
}

function pruneExpiredHistory() {
  const { scanRetentionDays } = getSettings();
  const empty = { removedScans: 0, removedHashes: 0, removedRestored: 0 };

  if (scanRetentionDays == null) {
    return empty;
  }

  const cutoff = new Date(Date.now() - scanRetentionDays * DAY_MS).toISOString();
  return pruneHistoryBefore(cutoff);
}

function updateSettings(body) {
  if (!body || !("scanRetentionDays" in body)) {
    const error = new Error("scanRetentionDays is required.");
    error.status = 400;
    throw error;
  }

  const { scanRetentionDays } = body;

  if (!SCAN_RETENTION_OPTIONS.includes(scanRetentionDays)) {
    const error = new Error(
      `scanRetentionDays must be one of: ${SCAN_RETENTION_OPTIONS.map((v) => v ?? "null").join(", ")}.`,
    );
    error.status = 400;
    throw error;
  }

  setSetting(SCAN_RETENTION_KEY, scanRetentionDays);
  const pruned = pruneExpiredHistory();

  return { settings: getSettings(), pruned };
}

module.exports = {
  getSettings,
  updateSettings,
  pruneExpiredHistory,
};
