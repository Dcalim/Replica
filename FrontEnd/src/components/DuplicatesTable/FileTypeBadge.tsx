import { useTranslation } from "react-i18next";
import type { FileKind } from "../../utils/fileHelpers";

const fileTypeBadgeClasses: Record<FileKind, string> = {
  image: "bg-blue-50 text-blue-700 ring-blue-100",
  video: "bg-violet-50 text-violet-700 ring-violet-100",
  document: "bg-amber-50 text-amber-700 ring-amber-100",
  other: "bg-slate-100 text-slate-600 ring-slate-200",
};

type FileTypeBadgeProps = {
  kind: FileKind;
};

const FileTypeBadge = ({ kind }: FileTypeBadgeProps) => {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${fileTypeBadgeClasses[kind]}`}
    >
      {t(`resultsView.fileTypes.${kind}`)}
    </span>
  );
};

export default FileTypeBadge;
