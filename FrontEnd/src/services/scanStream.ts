import type { ScanProgressEvent, ScanResult } from "../types/api";
import { ApiError } from "./axiosInterceptor";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

const parseStreamChunk = (
  chunk: string,
  onProgress: (event: ScanProgressEvent) => void,
): ScanResult | null => {
  for (const line of chunk.split("\n")) {
    if (!line.startsWith("data: ")) {
      continue;
    }

    const payload = JSON.parse(line.slice(6)) as
      | { type: "complete"; result: ScanResult }
      | { type: "error"; error: string }
      | ScanProgressEvent;

    if ("type" in payload) {
      if (payload.type === "complete") {
        return payload.result;
      }

      if (payload.type === "error") {
        throw new ApiError(payload.error, 500);
      }
    } else {
      onProgress(payload);
    }
  }

  return null;
};

const scanFolderWithProgress = async (
  directory: string,
  onProgress: (event: ScanProgressEvent) => void,
): Promise<ScanResult> => {
  const response = await fetch(`${API_BASE_URL}/files/scan/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ directory }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new ApiError(
      errorBody?.error ?? "Scan failed",
      response.status,
    );
  }

  if (!response.body) {
    throw new ApiError("Scan failed", 500);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const eventChunk of events) {
      const result = parseStreamChunk(eventChunk, onProgress);

      if (result) {
        return result;
      }
    }
  }

  if (buffer.trim()) {
    const result = parseStreamChunk(buffer, onProgress);

    if (result) {
      return result;
    }
  }

  throw new ApiError("Scan ended unexpectedly", 500);
};

export { scanFolderWithProgress };
