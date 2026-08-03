import { useTranslation } from "react-i18next";
import { HiChevronRight } from "react-icons/hi2";
import Button from "../Button";
import ClusterFileRow from "./ClusterFileRow";
import TableThumbnail from "./TableThumbnail";
import { openPreviewModal, toggleClusterExpanded } from "../../reducers/ui";
import { useAppDispatch, useAppSelector } from "../../store/store";
import type { DuplicateGroup } from "../../types/api";
import {
  formatBytes,
  formatPathSummary,
  getFileName,
  isPreviewableFile,
} from "../../utils/fileHelpers";

type ClusterRowProps = {
  group: DuplicateGroup;
};

const ClusterRow = ({ group }: ClusterRowProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isExpanded = useAppSelector((state) =>
    state.ui.expandedClusters.includes(group.hash),
  );

  const displayFile = group.files[0];
  const pathSummary = formatPathSummary(group.files);
  const hasPreview = group.files.some(isPreviewableFile);

  const handleOpenPreview = () => {
    if (!hasPreview) {
      return;
    }

    dispatch(openPreviewModal(group.hash));
  };

  return (
    <tbody className="border-b border-slate-100 last:border-b-0">
      <tr
        className={`transition-colors ${
          isExpanded ? "bg-white" : "bg-white hover:bg-slate-50/70"
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
            onClick={() => dispatch(toggleClusterExpanded(group.hash))}
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
              onClick={handleOpenPreview}
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

        <td className="px-3 py-4 align-middle" title={pathSummary}>
          <p className="truncate text-sm font-medium text-slate-900">
            {getFileName(displayFile)}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{pathSummary}</p>
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
                      {group.files.map((filePath) => (
                        <ClusterFileRow
                          key={filePath}
                          filePath={filePath}
                          fileSize={group.size}
                        />
                      ))}
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
};

export default ClusterRow;
