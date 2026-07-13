const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "heic",
  "heif",
]);

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "avi", "mkv", "webm", "m4v"]);

const DOCUMENT_EXTENSIONS = new Set(["pdf", "doc", "docx", "txt", "rtf"]);

export type FileKind = "image" | "video" | "document" | "other";

export const getFileExtension = (filePath: string) => {
  const name = filePath.split(/[/\\]/).pop() ?? filePath;
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1) {
    return "";
  }

  return name.slice(dotIndex + 1).toLowerCase();
};

export const getFileName = (filePath: string) =>
  filePath.split(/[/\\]/).pop() ?? filePath;

export const getFileKind = (filePath: string): FileKind => {
  const ext = getFileExtension(filePath);

  if (IMAGE_EXTENSIONS.has(ext)) {
    return "image";
  }

  if (VIDEO_EXTENSIONS.has(ext)) {
    return "video";
  }

  if (DOCUMENT_EXTENSIONS.has(ext)) {
    return "document";
  }

  return "other";
};

export const isImageFile = (filePath: string) =>
  getFileKind(filePath) === "image";

export const isPdfFile = (filePath: string) =>
  getFileExtension(filePath) === "pdf";

export const isPreviewableFile = (filePath: string) =>
  isImageFile(filePath) || isPdfFile(filePath);

export type PreviewKind = "image" | "pdf";

export const getPreviewKind = (filePath: string): PreviewKind | null => {
  if (isImageFile(filePath)) {
    return "image";
  }

  if (isPdfFile(filePath)) {
    return "pdf";
  }

  return null;
};

export const formatBytes = (bytes: number) => {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;

  return `${value >= 10 || index === 0 ? value.toFixed(index === 0 ? 0 : 1) : value.toFixed(2)} ${units[index]}`;
};

export const getUniqueParentDirs = (filePaths: string[]) => {
  const dirs = filePaths.map((filePath) => {
    const parts = filePath.split(/[/\\]/);
    parts.pop();
    return parts.join("/") || "/";
  });

  return [...new Set(dirs)];
};

export const formatPathSummary = (filePaths: string[]) => {
  const dirs = getUniqueParentDirs(filePaths).map((dir) => {
    const parts = dir.split(/[/\\]/).filter(Boolean);
    return parts.length > 0 ? `/${parts.at(-1)}` : dir;
  });

  return dirs.join(", ");
};

export const getClusterKey = (hash: string, size: number) => `${hash}:${size}`;
