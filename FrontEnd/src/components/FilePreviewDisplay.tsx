import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import apiService from "../services/apiService";
import { getFileName, getPreviewKind } from "../utils/fileHelpers";

type FilePreviewDisplayProps = {
  filePath: string;
};

const FilePreviewDisplay = ({ filePath }: FilePreviewDisplayProps) => {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  const fileName = getFileName(filePath);
  const previewKind = getPreviewKind(filePath);

  useEffect(() => {
    setFailed(false);
  }, [filePath]);

  if (failed) {
    return (
      <p className="text-sm text-slate-500">{t("resultsView.previewFailed")}</p>
    );
  }

  if (previewKind === "image") {
    return (
      <img
        src={apiService.getFilePreviewUrl(filePath)}
        alt={fileName}
        className="max-h-[50vh] max-w-full rounded-md object-contain"
        onError={() => setFailed(true)}
      />
    );
  }

  if (previewKind === "pdf") {
    return (
      <iframe
        src={apiService.getFilePreviewUrl(filePath)}
        title={fileName}
        className="h-[50vh] w-full rounded-md border-0 bg-white"
      />
    );
  }

  return null;
};

export default FilePreviewDisplay;
