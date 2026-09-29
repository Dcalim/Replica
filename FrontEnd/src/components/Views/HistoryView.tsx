import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HiChevronDown, HiOutlineClock } from "react-icons/hi2";
import Button from "../Button";
import apiService from "../../services/apiService";
import { ApiError } from "../../services/axiosInterceptor";
import { ROUTES } from "../../models/constant";
import { scanFolder } from "../../reducers/files";
import { showBanner } from "../../reducers/ui";
import { useAppDispatch, useAppSelector } from "../../store/store";
import type { HistoryDeletedFile, HistoryScan } from "../../types/api";
import { formatBytes, getFileName } from "../../utils/fileHelpers";

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const HistoryView = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isScanning = useAppSelector((state) => state.files.isScanning);
  const [scans, setScans] = useState<HistoryScan[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<HistoryDeletedFile[]>([]);
  const [expandedScanIds, setExpandedScanIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiService
      .getHistory()
      .then((history) => {
        if (cancelled) {
          return;
        }

        setScans(history.scans);
        setDeletedFiles(history.deletedFiles);
        setSelectedIds((current) =>
          current.filter((id) =>
            history.deletedFiles.some((file) => file.id === id && file.canRestore),
          ),
        );
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : t("historyView.loadErrorMessage"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, t]);

  const refreshHistory = () => setReloadKey((key) => key + 1);

  const retryLoadHistory = () => {
    setIsLoading(true);
    setError(null);
    refreshHistory();
  };

  const deletedByScanId = useMemo(() => {
    const map = new Map<number | null, HistoryDeletedFile[]>();

    for (const file of deletedFiles) {
      const key = file.scanId;
      const existing = map.get(key) ?? [];
      existing.push(file);
      map.set(key, existing);
    }

    return map;
  }, [deletedFiles]);

  const orphanDeleted = deletedByScanId.get(null) ?? [];

  const restorableSelected = selectedIds.filter((id) =>
    deletedFiles.some((file) => file.id === id && file.canRestore),
  );

  const toggleScanExpanded = (scanId: number) => {
    setExpandedScanIds((current) =>
      current.includes(scanId)
        ? current.filter((id) => id !== scanId)
        : [...current, scanId],
    );
  };

  const toggleFileSelected = (fileId: number) => {
    setSelectedIds((current) =>
      current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId],
    );
  };

  const toggleScanSelection = (files: HistoryDeletedFile[]) => {
    const restorable = files.filter((file) => file.canRestore).map((f) => f.id);

    if (restorable.length === 0) {
      return;
    }

    const allSelected = restorable.every((id) => selectedIds.includes(id));

    setSelectedIds((current) => {
      if (allSelected) {
        return current.filter((id) => !restorable.includes(id));
      }

      return [...new Set([...current, ...restorable])];
    });
  };

  const handleRescan = (directory: string) => {
    if (isScanning) {
      return;
    }

    dispatch(scanFolder(directory));
    navigate(ROUTES.DUPLICATES);
  };

  const handleRestore = async () => {
    if (restorableSelected.length === 0 || isRestoring) {
      return;
    }

    setIsRestoring(true);

    try {
      const result = await apiService.restoreDeletedFiles(restorableSelected);
      dispatch(
        showBanner({
          variant: "success",
          title: t("historyView.restoreSuccessTitle"),
          message: t("historyView.restoreSuccessMessage", {
            count: result.restored,
          }),
        }),
      );
      setSelectedIds([]);
      refreshHistory();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : t("historyView.restoreErrorMessage");

      dispatch(
        showBanner({
          variant: "error",
          title: t("historyView.restoreErrorTitle"),
          message,
        }),
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const renderDeletedRows = (files: HistoryDeletedFile[]) => {
    if (files.length === 0) {
      return (
        <p className="px-4 py-3 text-sm text-slate-500">
          {t("historyView.noDeletesForScan")}
        </p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="w-12 px-3 py-2.5">
                <span className="sr-only">{t("historyView.selectColumn")}</span>
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("historyView.fileColumn")}
              </th>
              <th className="w-28 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("historyView.sizeColumn")}
              </th>
              <th className="w-44 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("historyView.deletedAtColumn")}
              </th>
              <th className="w-32 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("historyView.statusColumn")}
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const selected = selectedIds.includes(file.id);

              return (
                <tr
                  key={file.id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selected}
                      disabled={!file.canRestore}
                      onChange={() => toggleFileSelected(file.id)}
                      aria-label={t("historyView.selectFile", {
                        name: getFileName(file.originalPath),
                      })}
                    />
                  </td>
                  <td className="min-w-0 px-3 py-2.5 text-left">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {getFileName(file.originalPath)}
                    </p>
                    <p
                      className="truncate font-mono text-xs text-slate-500"
                      title={file.originalPath}
                    >
                      {file.originalPath}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-slate-600">
                    {file.size != null ? formatBytes(file.size) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-left text-sm text-slate-600">
                    {formatDateTime(file.deletedAt)}
                  </td>
                  <td className="px-3 py-2.5 text-left text-sm font-semibold">
                    {file.restoredAt ? (
                      <span className="text-blue-500">
                        {t("historyView.statusRestored")}
                      </span>
                    ) : file.canRestore ? (
                      <span className=" text-emerald-600">
                        {t("historyView.statusRecoverable")}
                      </span>
                    ) : (
                      <span className="text-red-500">
                        {t("historyView.statusUnavailable")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col px-6 py-8 lg:px-10">
        <h1 className="font-['Sora'] text-2xl font-semibold text-slate-900">
          {t("historyView.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t("historyView.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start px-6 py-8 lg:px-10">
        <h1 className="font-['Sora'] text-2xl font-semibold text-slate-900">
          {t("historyView.title")}
        </h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Button
          variant="secondary"
          size="md"
          className="mt-4"
          onClick={retryLoadHistory}
        >
          {t("historyView.retry")}
        </Button>
      </div>
    );
  }

  if (scans.length === 0 && deletedFiles.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-8 py-24 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          <HiOutlineClock className="size-8 text-slate-500" aria-hidden />
        </span>
        <h1 className="mt-6 font-['Sora'] text-2xl font-semibold text-slate-900">
          {t("historyView.emptyTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t("historyView.empty")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-6 py-8 lg:px-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-left">
          <h1 className="font-['Sora'] text-2xl font-semibold text-slate-900">
            {t("historyView.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("historyView.subtitle")}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={restorableSelected.length === 0 || isRestoring}
          onClick={() => void handleRestore()}
        >
          {isRestoring
            ? t("historyView.restoring")
            : t("historyView.restoreSelected", {
                count: restorableSelected.length,
              })}
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("historyView.scansHeading")}
        </h2>

        {scans.length === 0 ? (
          <p className="text-sm text-slate-500">{t("historyView.noScans")}</p>
        ) : (
          scans.map((scan) => {
            const files = deletedByScanId.get(scan.id) ?? [];
            const expanded = expandedScanIds.includes(scan.id);
            const restorable = files.filter((file) => file.canRestore);
            const allSelected =
              restorable.length > 0 &&
              restorable.every((file) => selectedIds.includes(file.id));

            return (
              <div
                key={scan.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    onClick={() => toggleScanExpanded(scan.id)}
                    aria-expanded={expanded}
                  >
                    <HiChevronDown
                      className={`mt-0.5 size-5 shrink-0 text-slate-400 transition-transform ${
                        expanded ? "rotate-0" : "-rotate-90"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p
                        className="truncate font-mono text-sm font-medium text-slate-900"
                        title={scan.directory}
                      >
                        {scan.directory}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t("historyView.scanSummary", {
                          date: formatDateTime(scan.completedAt ?? scan.startedAt),
                          files: scan.scannedFiles,
                          groups: scan.duplicateGroups,
                          deleted: scan.deletedCount,
                          size: formatBytes(scan.reclaimableBytes),
                          status: t(`historyView.scanStatus.${scan.status}`),
                        })}
                      </p>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    {restorable.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleScanSelection(files)}
                      >
                        {allSelected
                          ? t("historyView.deselectScanFiles")
                          : t("historyView.selectScanFiles")}
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isScanning}
                      onClick={() => handleRescan(scan.directory)}
                    >
                      {t("historyView.rescan")}
                    </Button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-200">
                    {renderDeletedRows(files)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {orphanDeleted.length > 0 && (
        <section className="mt-8 space-y-4">
          <h2 className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t("historyView.otherDeletesHeading")}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {renderDeletedRows(orphanDeleted)}
          </div>
        </section>
      )}
    </div>
  );
};

export default HistoryView;
