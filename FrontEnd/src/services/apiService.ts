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

const apiService = {
  scanFolder,
  scanFolderWithProgress,
  checkHealth,
};

export type { ScanProgressEvent };
export default apiService;
