import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiChevronRight,
  HiOutlineDocument,
  HiOutlineFilm,
  HiOutlinePhoto,
} from "react-icons/hi2";
import Button from "../Button";
import Loader, {
  buildProgressLabel,
  buildProgressPhaseLabel,
  buildProgressTitle,
} from "../Loader";
import apiService from "../../services/apiService";
import { ROUTES } from "../../models/constant";
import { openPreviewModal } from "../../reducers/ui";
import { useAppDispatch, useAppSelector } from "../../store/store";
import type { DuplicateGroup } from "../../types/api";
import type { FileKind } from "../../utils/fileHelpers";
import {
  formatBytes,
  formatPathSummary,
  getFileKind,
  getFileName,
  isImageFile,
  isPreviewableFile,
} from "../../utils/fileHelpers";

const fileTypeBadgeClasses: Record<FileKind, string> = {
  image: "bg-blue-50 text-blue-700 ring-blue-100",
  video: "bg-violet-50 text-violet-700 ring-violet-100",
  document: "bg-amber-50 text-amber-700 ring-amber-100",
  other: "bg-slate-100 text-slate-600 ring-slate-200",
};

const FileTypeIcon = ({ filePath }: { filePath: string }) => {
  const kind = getFileKind(filePath);

  if (kind === "image") {
    return <HiOutlinePhoto className="size-5 text-blue-600" aria-hidden />;
  }

  if (kind === "video") {
    return <HiOutlineFilm className="size-5 text-violet-600" aria-hidden />;
  }

  return <HiOutlineDocument className="size-5 text-slate-500" aria-hidden />;
};

const FileTypeBadge = ({ kind }: { kind: FileKind }) => {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${fileTypeBadgeClasses[kind]}`}
    >
      {t(`resultsView.fileTypes.${kind}`)}
    </span>
  );
};

const TableThumbnail = ({ filePath }: { filePath: string }) => {
  const [failed, setFailed] = useState(false);

  if (!isImageFile(filePath) || failed) {
    return (
      <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
        <FileTypeIcon filePath={filePath} />
      </span>
    );
  }

  return (
    <img
      src={apiService.getFilePreviewUrl(filePath)}
      alt=""
      className="size-11 rounded-lg object-cover ring-1 ring-slate-200"
      onError={() => setFailed(true)}
    />
  );
};

const ResultsView = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const duplicateFiles = useAppSelector((state) => state.files.duplicateFiles);
  const isScanning = useAppSelector((state) => state.files.isScanning);
  const scanProgress = useAppSelector((state) => state.files.scanProgress);

  const [expandedClusters, setExpandedClusters] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const selectionStats = useMemo(() => {
    if (!duplicateFiles) {
      return { count: 0, reclaimableBytes: 0 };
    }

    const sizeByPath = new Map<string, number>();

    for (const group of duplicateFiles.duplicates) {
      for (const filePath of group.files) {
        sizeByPath.set(filePath, group.size);
      }
    }

    let reclaimableBytes = 0;

    for (const filePath of selectedFiles) {
      reclaimableBytes += sizeByPath.get(filePath) ?? 0;
    }

    return { count: selectedFiles.length, reclaimableBytes };
  }, [duplicateFiles, selectedFiles]);

  const toggleClusterExpanded = (hash: string) => {
    setExpandedClusters((current) =>
      current.includes(hash)
        ? current.filter((id) => id !== hash)
        : [...current, hash],
    );
  };

  const toggleFileSelected = (filePath: string) => {
    setSelectedFiles((current) =>
      current.includes(filePath)
        ? current.filter((path) => path !== filePath)
        : [...current, filePath],
    );
  };

  const handleOpenPreview = (group: DuplicateGroup) => {
    if (!group.files.some(isPreviewableFile)) {
      return;
    }

    dispatch(openPreviewModal(group.hash));
  };

  if (isScanning) {
    const progressStatus = scanProgress
      ? buildProgressLabel(scanProgress, t)
      : t("loader.scanning");

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-8 py-24">
        <Loader
          show
          mode="progress"
          progress={scanProgress ?? { current: 0, total: null, unit: "files" }}
          heading={t("loader.progress.heading")}
          title={
            scanProgress
              ? buildProgressTitle(scanProgress, t)
              : t("loader.progress.inProgress")
          }
          label={
            scanProgress
              ? buildProgressPhaseLabel(scanProgress.phase, t) ?? progressStatus
              : progressStatus
          }
          className="w-full max-w-none"
        />
      </div>
    );
  }

  if (!duplicateFiles || duplicateFiles.duplicates.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-8 py-24 text-center">
        <h1 className="font-['Sora'] text-2xl font-semibold text-slate-900">
          {t("resultsView.emptyTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t("resultsView.empty")}</p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onClick={() => navigate(ROUTES.SCAN)}
        >
          {t("resultsView.startScan")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
      <div className="mb-6 text-left">
        <h1 className="font-['Sora'] text-2xl font-semibold text-slate-900">
          {t("resultsView.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("resultsView.clustersFound", {
            count: duplicateFiles.duplicateGroups,
          })}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-12" />
              <col className="w-20" />
              <col className="w-28" />
              <col />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-3.5">
                  <span className="sr-only">{t("resultsView.expandColumn")}</span>
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("resultsView.previewColumn")}
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("resultsView.copiesColumn")}
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("resultsView.locationsColumn")}
                </th>
                <th className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("resultsView.sizeColumn")}
                </th>
              </tr>
            </thead>

            {duplicateFiles.duplicates.map((group) => {
              const isExpanded = expandedClusters.includes(group.hash);
              const displayFile = group.files[0];
              const pathSummary = formatPathSummary(group.files);
              const hasPreview = group.files.some(isPreviewableFile);

              return (
                <tbody
                  key={group.hash}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <tr
                    className={`transition-colors ${
                      isExpanded
                        ? "bg-white"
                        : "bg-white hover:bg-slate-50/70"
                    }`}
                  >
                    <td className="px-3 py-4 align-middle">
                      <Button
                        variant="clear"
                        iconOnly
                        size="sm"
                        ariaLabel={
                          isExpanded
                            ? t("resultsView.collapseCluster")
                            : t("resultsView.expandCluster")
                        }
                        onClick={() => toggleClusterExpanded(group.hash)}
                      >
                        <HiChevronRight
                          className={`size-5 transition-transform duration-500 ease-in-out ${
                            isExpanded
                              ? "rotate-90 text-blue-600"
                              : "rotate-0 text-slate-500"
                          }`}
                          aria-hidden
                        />
                      </Button>
                    </td>

                    <td className="px-3 py-4 align-middle">
                      {hasPreview ? (
                        <Button
                          variant="clear"
                          iconOnly
                          size="sm"
                          className="rounded-lg p-0 hover:opacity-80"
                          ariaLabel={t("resultsView.openPreview", {
                            name: getFileName(displayFile),
                          })}
                          onClick={() => handleOpenPreview(group)}
                        >
                          <TableThumbnail filePath={displayFile} />
                        </Button>
                      ) : (
                        <TableThumbnail filePath={displayFile} />
                      )}
                    </td>

                    <td className="px-3 py-4 align-middle text-sm font-medium whitespace-nowrap text-slate-700">
                      {t("resultsView.copies", { count: group.files.length })}
                    </td>

                    <td
                      className="px-3 py-4 align-middle"
                      title={pathSummary}
                    >
                      <p className="truncate text-sm font-medium text-slate-900">
                        {getFileName(displayFile)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {pathSummary}
                      </p>
                    </td>

                    <td className="px-3 py-4 text-right align-middle text-sm font-medium whitespace-nowrap text-slate-700">
                      {formatBytes(group.size)}
                    </td>
                  </tr>

                  <tr className="bg-slate-100">
                    <td colSpan={5} className="p-0">
                      <div
                        className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-3 pb-4 pt-1">
                            <div className="ml-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                              <table className="min-w-full">
                                <thead>
                                  <tr className="border-b border-slate-200 bg-slate-200/50">
                                    <th className="w-16 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      {t("resultsView.selectColumn")}
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      {t("resultsView.fileColumn")}
                                    </th>
                                    <th className="w-28 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      {t("resultsView.sizeColumn")}
                                    </th>
                                    <th className="w-28 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      {t("resultsView.typeColumn")}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/70">
                                  {group.files.map((filePath) => {
                                    const fileName = getFileName(filePath);
                                    const fileKind = getFileKind(filePath);
                                    const isSelected =
                                      selectedFiles.includes(filePath);

                                    return (
                                      <tr
                                        key={filePath}
                                        className={
                                          isSelected
                                            ? "bg-blue-100/60"
                                            : "bg-slate-100 hover:bg-slate-200/60"
                                        }
                                      >
                                        <td className="px-4 py-3 align-middle">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() =>
                                              toggleFileSelected(filePath)
                                            }
                                            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-300"
                                            aria-label={t(
                                              "resultsView.selectFile",
                                              { name: fileName },
                                            )}
                                          />
                                        </td>

                                        <td className="px-4 py-3 align-middle">
                                          <p className="text-sm font-medium text-slate-900">
                                            {fileName}
                                          </p>
                                          <p
                                            className="mt-0.5 truncate font-mono text-xs text-slate-400"
                                            title={filePath}
                                          >
                                            {filePath}
                                          </p>
                                        </td>

                                        <td className="px-4 py-3 text-right align-middle text-sm text-slate-600">
                                          {formatBytes(group.size)}
                                        </td>

                                        <td className="px-4 py-3 align-middle">
                                          <FileTypeBadge kind={fileKind} />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              );
            })}
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {selectionStats.count > 0
              ? t("resultsView.fileSelectionSummary", {
                  count: selectionStats.count,
                  size: formatBytes(selectionStats.reclaimableBytes),
                })
              : t("resultsView.noFileSelection")}
          </p>

          <Button
            variant="alert"
            size="md"
            disabled={selectionStats.count === 0}
            onClick={() => {
              // MVP 2: move selected files to trash
            }}
          >
            {t("resultsView.moveToTrash")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
