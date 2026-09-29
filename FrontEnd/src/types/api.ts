export type DuplicateGroup = {
  hash: string;
  size: number;
  files: string[];
};

export type ScanResult = {
  scanId: number;
  directory: string;
  scannedFiles: number;
  files: string[];
  duplicateGroups: number;
  reclaimableBytes: number;
  reusedHashes: number;
  computedHashes: number;
  duplicates: DuplicateGroup[];
};

export type HealthResult = {
  status: string;
  timestamp: string;
};

export type ScanProgressEvent = {
  phase: "discovering" | "hashing";
  current: number;
  total: number | null;
  unit: "files" | "folders";
};

export type ScanProgress = ScanProgressEvent;

export type ScanFolderRequest = {
  directory: string;
};

export type ApiErrorResponse = {
  error: string;
};

export type HistoryScan = {
  id: number;
  directory: string;
  startedAt: string;
  completedAt: string | null;
  scannedFiles: number;
  duplicateGroups: number;
  reclaimableBytes: number;
  status: "running" | "completed" | "failed";
  deletedCount: number;
};

export type HistoryDeletedFile = {
  id: number;
  originalPath: string;
  size: number | null;
  hash: string | null;
  scanId: number | null;
  deletedAt: string;
  restoredAt: string | null;
  recoveryPath: string | null;
  canRestore: boolean;
};

export type HistoryResult = {
  scans: HistoryScan[];
  deletedFiles: HistoryDeletedFile[];
};

export type RestoreResult = {
  restored: number;
  files: string[];
};

export type ScanRetentionDays = number | null;

export type Settings = {
  scanRetentionDays: ScanRetentionDays;
  scanRetentionOptions: ScanRetentionDays[];
};

export type UpdateSettingsResult = {
  settings: Settings;
  pruned: {
    removedScans: number;
    removedHashes: number;
    removedRestored: number;
  };
};
