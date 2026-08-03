import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../Button";
import ClusterRow from "./ClusterRow";
import apiService from "../../services/apiService";
import { ROUTES } from "../../models/constant";
import { clearScanState } from "../../reducers/files";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { formatBytes } from "../../utils/fileHelpers";

const DuplicatesTable = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const clusters =
    useAppSelector((state) => state.files.duplicateFiles?.duplicates) ?? [];
  const selectedFiles = useAppSelector((state) => state.ui.selectedFiles);

  const selectionStats = (() => {
    const sizeByPath = new Map<string, number>();

    for (const group of clusters) {
      for (const filePath of group.files) {
        sizeByPath.set(filePath, group.size);
      }
    }

    let reclaimableBytes = 0;

    for (const filePath of selectedFiles) {
      reclaimableBytes += sizeByPath.get(filePath) ?? 0;
    }

    return { count: selectedFiles.length, reclaimableBytes };
  })();

  const handleDelete = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    await apiService.deleteDuplicates(selectedFiles);
    dispatch(clearScanState());
    navigate(ROUTES.SCAN);
  };

  return (
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

          {clusters.map((group) => (
            <ClusterRow key={group.hash} group={group} />
          ))}
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
          onClick={handleDelete}
        >
          {t("resultsView.moveToTrash")}
        </Button>
      </div>
    </div>
  );
};

export default DuplicatesTable;
