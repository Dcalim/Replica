import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../Button";
import DuplicatesTable from "../DuplicatesTable/DuplicatesTable";
import Loader, {
  buildProgressLabel,
  buildProgressPhaseLabel,
  buildProgressTitle,
} from "../Loader";
import { ROUTES } from "../../models/constant";
import { setSelectedFiles } from "../../reducers/ui";
import { useAppDispatch, useAppSelector } from "../../store/store";

const ResultsView = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const duplicateFiles = useAppSelector((state) => state.files.duplicateFiles);
  const isScanning = useAppSelector((state) => state.files.isScanning);
  const scanProgress = useAppSelector((state) => state.files.scanProgress);
  const selectedFiles = useAppSelector((state) => state.ui.selectedFiles);

  const allButOnePaths =
    duplicateFiles?.duplicates.flatMap((group) => group.files.slice(1)) ?? [];

  const allButOneSelected =
    allButOnePaths.length > 0 &&
    allButOnePaths.every((path) => selectedFiles.includes(path)) &&
    selectedFiles.length === allButOnePaths.length;

  const handleSelectAllButOne = () => {
    dispatch(setSelectedFiles(allButOneSelected ? [] : allButOnePaths));
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-left">
          <h1 className="font-['Sora'] text-2xl font-semibold text-slate-900">
            {t("resultsView.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("resultsView.clustersFound", {
              count: duplicateFiles.duplicateGroups,
            })}
          </p>
        </div>

        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <Button
            variant="secondary"
            size="md"
            onClick={handleSelectAllButOne}
          >
            {allButOneSelected
              ? t("resultsView.deselectAll")
              : t("resultsView.selectAll")}
          </Button>
          <p className="whitespace-nowrap text-left text-xs text-slate-500 sm:text-right">
            {t("resultsView.selectAllNote")}
          </p>
        </div>
      </div>

      <DuplicatesTable />
    </div>
  );
};

export default ResultsView;
