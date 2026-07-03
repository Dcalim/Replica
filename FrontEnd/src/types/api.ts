export type DuplicateGroup = {
  hash: string;
  size: number;
  files: string[];
};

export type ScanResult = {
  directory: string;
  scannedFiles: number;
  files: string[];
  duplicateGroups: number;
  reclaimableBytes: number;
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
