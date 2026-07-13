import type { DuplicateGroup, ScanResult } from "../types/api";
import { isPreviewableFile } from "../utils/fileHelpers";

export const getDuplicateClusters = (
  duplicateFiles: ScanResult | null,
): DuplicateGroup[] =>
  duplicateFiles?.duplicates.filter((group) => group.files.length >= 2) ?? [];

export const filterDuplicateClusters = (
  clusters: DuplicateGroup[],
  filter: string,
): DuplicateGroup[] => {
  const query = filter.trim().toLowerCase();

  if (!query) {
    return clusters;
  }

  return clusters.filter((group) =>
    group.files.some((filePath) => filePath.toLowerCase().includes(query)),
  );
};

export const getPreviewableClusters = (
  clusters: DuplicateGroup[],
): DuplicateGroup[] =>
  clusters.filter((group) => group.files.some(isPreviewableFile));
