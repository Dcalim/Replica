import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
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
import { setDuplicateFilter, openPreviewModal } from "../../reducers/ui";
import {
  filterDuplicateClusters,
  getDuplicateClusters,
} from "../../selectors/duplicates";
import { useAppDispatch, useAppSelector } from "../../store/store";
import type { DuplicateGroup } from "../../types/api";
import {
  formatBytes,
  formatPathSummary,
  getClusterKey,
  getFileKind,
  getFileName,
  isImageFile,
  isPreviewableFile,
} from "../../utils/fileHelpers";

const FileTypeIcon = ({ filePath }: { filePath: string }) => {
  const kind = getFileKind(filePath);

  if (kind === "image") {
    return <HiOutlinePhoto className="size-5 text-blue-600" aria-hidden />;
  }

  if (kind === "video") {
    return <HiOutlineFilm className="size-5 text-blue-600" aria-hidden />;
  }

  return <HiOutlineDocument className="size-5 text-blue-600" aria-hidden />;
};

const TableThumbnail = ({ filePath }: { filePath: string }) => {
  const [failed, setFailed] = useState(false);

  if (!isImageFile(filePath) || failed) {
    return (
      <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
        <FileTypeIcon filePath={filePath} />
      </span>
    );
  }

  return (
    <img
      src={apiService.getFilePreviewUrl(filePath)}
      alt=""
      className="size-10 rounded-lg object-cover ring-1 ring-slate-200"
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
  const filter = useAppSelector((state) => state.ui.duplicateFilter);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const clusters = useMemo(
    () => getDuplicateClusters(duplicateFiles),
    [duplicateFiles],
  );

  const filteredClusters = useMemo(
    () => filterDuplicateClusters(clusters, filter),
    [clusters, filter],
  );

  const allFilteredSelected =
    filteredClusters.length > 0 &&
    filteredClusters.every((group) =>
      selectedKeys.has(getClusterKey(group.hash, group.size)),
    );

  const selectedStats = useMemo(() => {
    let count = 0;
    let reclaimableBytes = 0;

    for (const group of clusters) {
      const key = getClusterKey(group.hash, group.size);

      if (!selectedKeys.has(key)) {
        continue;
      }

      count += 1;
      reclaimableBytes += group.size * (group.files.length - 1);
    }

    return { count, reclaimableBytes };
  }, [clusters, selectedKeys]);

  const handleToggleCluster = (group: DuplicateGroup) => {
    const key = getClusterKey(group.hash, group.size);

    setSelectedKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedKeys(new Set());
      return;
    }

    setSelectedKeys(
      new Set(
        filteredClusters.map((group) => getClusterKey(group.hash, group.size)),
      ),
    );
  };

  const handleOpenPreview = (group: DuplicateGroup) => {
    const key = getClusterKey(group.hash, group.size);
    const previewPaths = group.files.filter(isPreviewableFile);

    if (previewPaths.length === 0) {
      return;
    }

    dispatch(openPreviewModal(key));
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

  if (!duplicateFiles || clusters.length === 0) {
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="font-['Sora'] text-2xl font-semibold text-slate-900">
            {t("resultsView.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("resultsView.clustersFound", { count: clusters.length })}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={filter}
            onChange={(event) =>
              dispatch(setDuplicateFilter(event.target.value))
            }
            placeholder={t("resultsView.filterPlaceholder")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-56"
          />
          <Button variant="secondary" size="md" onClick={handleSelectAll}>
            {allFilteredSelected
              ? t("resultsView.deselectAll")
              : t("resultsView.selectAll")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <span className="sr-only">{t("resultsView.selectColumn")}</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("resultsView.previewColumn")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("resultsView.fileColumn")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("resultsView.copiesColumn")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("resultsView.locationsColumn")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("resultsView.sizeColumn")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredClusters.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    {t("resultsView.noMatches")}
                  </td>
                </tr>
              ) : (
                filteredClusters.map((group) => {
                  const key = getClusterKey(group.hash, group.size);
                  const displayFile = group.files[0];
                  const fileName = getFileName(displayFile);
                  const pathSummary = formatPathSummary(group.files);
                  const isSelected = selectedKeys.has(key);
                  const hasPreview = group.files.some(isPreviewableFile);

                  return (
                    <tr
                      key={key}
                      className={isSelected ? "bg-blue-50/60" : "bg-white"}
                    >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCluster(group)}
                            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-300"
                            aria-label={t("resultsView.selectCluster", {
                              name: fileName,
                            })}
                          />
                        </td>

                        <td className="px-4 py-4">
                          {hasPreview ? (
                            <Button
                              variant="clear"
                              iconOnly
                              size="sm"
                              className="rounded-lg p-0 hover:opacity-80"
                              ariaLabel={t("resultsView.openPreview", {
                                name: fileName,
                              })}
                              onClick={() => handleOpenPreview(group)}
                            >
                              <TableThumbnail filePath={displayFile} />
                            </Button>
                          ) : (
                            <TableThumbnail filePath={displayFile} />
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {hasPreview ? (
                            <Button
                              variant="link"
                              className="justify-start text-left"
                              onClick={() => handleOpenPreview(group)}
                            >
                              {fileName}
                            </Button>
                          ) : (
                            <span className="font-medium text-slate-900">
                              {fileName}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {t("resultsView.copies", { count: group.files.length })}
                        </td>

                        <td
                          className="max-w-xs px-4 py-4 text-sm text-slate-500"
                          title={pathSummary}
                        >
                          <span className="line-clamp-2">{pathSummary}</span>
                        </td>

                        <td className="px-4 py-4 text-right text-sm text-slate-600">
                          {formatBytes(group.size)}
                        </td>
                      </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {selectedStats.count > 0
              ? t("resultsView.selectionSummary", {
                  count: selectedStats.count,
                  size: formatBytes(selectedStats.reclaimableBytes),
                })
              : t("resultsView.noSelection")}
          </p>

          <Button
            variant="alert"
            size="md"
            disabled={selectedStats.count === 0}
            onClick={() => {
              // MVP 2: move selected duplicates to trash
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
