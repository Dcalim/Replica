import axiosInstance from "./axiosInterceptor";
import { scanFolderWithProgress } from "./scanStream";
import type {
  HealthResult,
  ScanFolderRequest,
  ScanProgressEvent,
  ScanResult,
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

const apiService = {
  scanFolder,
  scanFolderWithProgress,
  checkHealth,
  getFilePreviewUrl,
};

export type { ScanProgressEvent };
export { getFilePreviewUrl };
export default apiService;
