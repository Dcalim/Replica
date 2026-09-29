import { useTranslation } from "react-i18next";
import { HiOutlineFolderOpen } from "react-icons/hi2";

interface ScannedFolderHeaderProps {
  directory: string;
  className?: string;
}

const ScannedFolderHeader = ({
  directory,
  className = "",
}: ScannedFolderHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm ${className}`}
    >
      <HiOutlineFolderOpen className="size-5 shrink-0 text-blue-600" aria-hidden />
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("resultsView.scannedFolder")}
      </span>
      <span
        className="min-w-0 truncate text-left font-mono text-sm text-slate-900"
        title={directory}
      >
        {directory}
      </span>
    </div>
  );
};

export default ScannedFolderHeader;
