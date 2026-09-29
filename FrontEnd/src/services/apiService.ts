import axiosInstance from "./axiosInterceptor";
import { scanFolderWithProgress } from "./scanStream";
import type {
  HealthResult,
  HistoryResult,
  RestoreResult,
  ScanFolderRequest,
  ScanProgressEvent,
  ScanResult,
  ScanRetentionDays,
  Settings,
  UpdateSettingsResult,
} from "../types/api";

const scanFolder = async (directory: string): Promise<ScanResult> => {
  const payload: ScanFolderRequest = { directory };

  const { data } = await axiosInstance.post<ScanResult>(
    "/files/scan",
    payload,
  );
  return data;
};

const checkHealth = async (): Promise<HealthResult> => {
  const { data } = await axiosInstance.get<HealthResult>("/health");
  return data;
};

const getFilePreviewUrl = (filePath: string) =>
  `${axiosInstance.defaults.baseURL}/files/preview?path=${encodeURIComponent(filePath)}`;

const deleteDuplicates = async (
  files: string[],
  scanId?: number | null,
): Promise<void> => {
  const { data } = await axiosInstance.delete<void>("/files/delete", {
    data: { files, scanId: scanId ?? undefined },
  });
  return data;
};

const getHistory = async (): Promise<HistoryResult> => {
  const { data } = await axiosInstance.get<HistoryResult>("/history");
  return data;
};

const restoreDeletedFiles = async (ids: number[]): Promise<RestoreResult> => {
  const { data } = await axiosInstance.post<RestoreResult>("/history/restore", {
    ids,
  });
  return data;
};

const getSettings = async (): Promise<Settings> => {
  const { data } = await axiosInstance.get<Settings>("/settings");
  return data;
};

const updateScanRetention = async (
  scanRetentionDays: ScanRetentionDays,
): Promise<UpdateSettingsResult> => {
  const { data } = await axiosInstance.put<UpdateSettingsResult>("/settings", {
    scanRetentionDays,
  });
  return data;
};

const apiService = {
  scanFolder,
  scanFolderWithProgress,
  checkHealth,
  getFilePreviewUrl,
  deleteDuplicates,
  getHistory,
  restoreDeletedFiles,
  getSettings,
  updateScanRetention,
};

export type { ScanProgressEvent };
export { getFilePreviewUrl };
export default apiService;
