import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import Button from "../Button";
import DuplicatesTable from "../DuplicatesTable/DuplicatesTable";
import ScannedFolderHeader from "../ScannedFolderHeader";
import Loader, {
  buildProgressLabel,
  buildProgressPhaseLabel,
  buildProgressTitle,
} from "../Loader";
import { ROUTES } from "../../models/constant";
import { setSelectedFiles } from "../../reducers/ui";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { clearScanState } from "../../reducers/files";

const ResultsView = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const duplicateFiles = useAppSelector((state) => state.files.duplicateFiles);
  const isScanning = useAppSelector((state) => state.files.isScanning);
  const scanProgress = useAppSelector((state) => state.files.scanProgress);
  const activeDirectory = useAppSelector((state) => state.files.activeDirectory);
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
        {activeDirectory && (
          <ScannedFolderHeader directory={activeDirectory} className="mb-6" />
        )}
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

  // No scan has been run yet
  if (!duplicateFiles) {
    return (
      <div className="m-auto flex w-full max-w-2xl flex-col items-center text-center">
        <h1 className="mt-6 font-['Sora'] text-2xl font-semibold text-slate-900">
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

  // Scan finished, but no duplicate groups were found
  if (duplicateFiles.duplicates.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-8 py-24 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
          <HiOutlineCheckCircle className="size-8 text-emerald-600" aria-hidden />
        </span>
        <h1 className="mt-6 font-['Sora'] text-2xl font-semibold text-slate-900">
          {t("resultsView.noDuplicatesTitle")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("resultsView.noDuplicates")}
        </p>
        <p className="mt-4 max-w-md text-sm text-slate-600">
          {t("resultsView.noDuplicatesScanned", {
            count: duplicateFiles.scannedFiles,
          })}{" "}
          <span
            className="font-mono text-xs text-slate-500"
            title={duplicateFiles.directory}
          >
            {duplicateFiles.directory}
          </span>
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-8"
          onClick={() => {
            dispatch(clearScanState());
            navigate(ROUTES.SCAN)
          }}
        >
          {t("resultsView.scanAnotherFolder")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
      <ScannedFolderHeader directory={duplicateFiles.directory} className="mb-6" />

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
          {duplicateFiles.reusedHashes > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {t("resultsView.reusedHashes", {
                reused: duplicateFiles.reusedHashes,
                computed: duplicateFiles.computedHashes,
              })}
            </p>
          )}
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
