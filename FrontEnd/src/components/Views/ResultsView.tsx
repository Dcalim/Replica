import Button from "../Button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../models/constant";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../store/store";
import Loader, {
  buildProgressLabel,
  buildProgressPhaseLabel,
  buildProgressTitle,
} from "../Loader";

const ResultsView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const duplicateFiles = useAppSelector((state) => state.files.duplicateFiles);
  const isScanning = useAppSelector((state) => state.files.isScanning);
  const scanProgress = useAppSelector((state) => state.files.scanProgress);

  if (isScanning) {
    const progressStatus = scanProgress
      ? buildProgressLabel(scanProgress, t)
      : t("loader.scanning");

    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-8 py-24 sm:px-16">
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center py-12 text-center">
      <h1>{t('resultsView.title')}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {duplicateFiles
          ? t('resultsView.summary', {
              groups: duplicateFiles.duplicateGroups,
              files: duplicateFiles.scannedFiles,
            })
          : t('resultsView.empty')}
      </p>
      <Button
        variant="primary"
        size="md"
        className="mt-6"
        onClick={() => navigate(ROUTES.SCAN)}
      >
        {t('resultsView.backButton')}
      </Button>
    </div>
  )
}

export default ResultsView
