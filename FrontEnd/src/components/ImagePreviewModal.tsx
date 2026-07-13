import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HiChevronLeft,
  HiChevronRight,
  HiXMark,
} from "react-icons/hi2";
import Button from "./Button";
import FilePreviewDisplay from "./FilePreviewDisplay";
import {
  filterDuplicateClusters,
  getDuplicateClusters,
  getPreviewableClusters,
} from "../selectors/duplicates";
import { closeModal, setPreviewClusterKey } from "../reducers/ui";
import { useAppDispatch, useAppSelector } from "../store/store";
import {
  formatBytes,
  getClusterKey,
  getFileName,
  isPreviewableFile,
} from "../utils/fileHelpers";

const ImagePreviewModal = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const previewClusterKey = useAppSelector((state) => state.ui.previewClusterKey);
  const duplicateFiles = useAppSelector((state) => state.files.duplicateFiles);
  const duplicateFilter = useAppSelector((state) => state.ui.duplicateFilter);
  const [fileIndex, setFileIndex] = useState(0);

  const clusters = useMemo(
    () =>
      getPreviewableClusters(
        filterDuplicateClusters(
          getDuplicateClusters(duplicateFiles),
          duplicateFilter,
        ),
      ),
    [duplicateFiles, duplicateFilter],
  );

  const clusterIndex = useMemo(
    () =>
      previewClusterKey === null
        ? -1
        : clusters.findIndex(
            (group) =>
              getClusterKey(group.hash, group.size) === previewClusterKey,
          ),
    [clusters, previewClusterKey],
  );

  const cluster = clusterIndex >= 0 ? clusters[clusterIndex] : null;
  const previewPaths = useMemo(
    () => cluster?.files.filter(isPreviewableFile) ?? [],
    [cluster],
  );

  const currentPath = previewPaths[fileIndex];
  const fileName = currentPath ? getFileName(currentPath) : "";

  const canGoPrevFile = fileIndex > 0;
  const canGoNextFile = fileIndex < previewPaths.length - 1;
  const canGoPrevCluster = clusterIndex > 0;
  const canGoNextCluster = clusterIndex >= 0 && clusterIndex < clusters.length - 1;

  const closePreview = () => dispatch(closeModal());

  const goToCluster = (nextIndex: number) => {
    const nextCluster = clusters[nextIndex];

    if (!nextCluster) {
      return;
    }

    dispatch(
      setPreviewClusterKey(getClusterKey(nextCluster.hash, nextCluster.size)),
    );
  };

  useEffect(() => {
    if (previewClusterKey === null) {
      return;
    }

    setFileIndex(0);
  }, [previewClusterKey]);

  useEffect(() => {
    if (previewClusterKey === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dispatch(closeModal());
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [dispatch, previewClusterKey]);

  useEffect(() => {
    if (previewClusterKey !== null && clusterIndex === -1) {
      dispatch(closeModal());
    }
  }, [clusterIndex, dispatch, previewClusterKey]);

  if (previewClusterKey === null || !cluster || !currentPath) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <Button
        variant="overlay"
        ariaLabel={t("resultsView.closePreview")}
        onClick={closePreview}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-preview-heading"
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0 text-left">
            <h2
              id="image-preview-heading"
              className="truncate font-['Sora'] text-lg font-semibold text-slate-900"
            >
              {fileName}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {t("resultsView.clusterCounter", {
                current: clusterIndex + 1,
                total: clusters.length,
              })}
              {previewPaths.length > 1 &&
                ` · ${t("resultsView.previewCounter", {
                  current: fileIndex + 1,
                  total: previewPaths.length,
                })}`}
              {` · ${formatBytes(cluster.size)}`}
            </p>
          </div>

          <Button
            variant="clear"
            iconOnly
            size="sm"
            className="shrink-0 text-slate-400 hover:text-slate-600"
            ariaLabel={t("resultsView.closePreview")}
            onClick={closePreview}
          >
            <HiXMark className="size-5" aria-hidden />
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="relative flex min-h-[280px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-blue-50/30 p-4">
            {canGoPrevFile && (
              <Button
                variant="icon"
                iconOnly
                size="md"
                className="absolute left-14 top-1/2 z-10 -translate-y-1/2"
                ariaLabel={t("resultsView.previousFile")}
                onClick={() => setFileIndex((current) => current - 1)}
              >
                <HiChevronLeft className="size-4" aria-hidden />
              </Button>
            )}

            <FilePreviewDisplay filePath={currentPath} />

            {canGoNextFile && (
              <Button
                variant="icon"
                iconOnly
                size="md"
                className="absolute right-14 top-1/2 z-10 -translate-y-1/2"
                ariaLabel={t("resultsView.nextFile")}
                onClick={() => setFileIndex((current) => current + 1)}
              >
                <HiChevronRight className="size-4" aria-hidden />
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("resultsView.previewPaths")}
            </p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
              {cluster.files.map((filePath) => (
                <li
                  key={filePath}
                  className="truncate font-mono text-xs text-slate-600"
                  title={filePath}
                >
                  {filePath}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <Button
            variant="primary"
            size="sm"
            disabled={!canGoPrevCluster}
            onClick={() => goToCluster(clusterIndex - 1)}
          >
            {t("resultsView.previousCluster")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!canGoNextCluster}
            onClick={() => goToCluster(clusterIndex + 1)}
          >
            {t("resultsView.nextCluster")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
