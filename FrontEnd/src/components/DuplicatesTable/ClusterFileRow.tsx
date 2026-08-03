import { useTranslation } from "react-i18next";
import FileTypeBadge from "./FileTypeBadge";
import { toggleFileSelected } from "../../reducers/ui";
import { useAppDispatch, useAppSelector } from "../../store/store";
import {
  formatBytes,
  getFileKind,
  getFileName,
} from "../../utils/fileHelpers";

type ClusterFileRowProps = {
  filePath: string;
  fileSize: number;
};

const ClusterFileRow = ({ filePath, fileSize }: ClusterFileRowProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isSelected = useAppSelector((state) =>
    state.ui.selectedFiles.includes(filePath),
  );
  const fileName = getFileName(filePath);
  const fileKind = getFileKind(filePath);

  return (
    <tr
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
          onChange={() => dispatch(toggleFileSelected(filePath))}
          className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-300"
          aria-label={t("resultsView.selectFile", { name: fileName })}
        />
      </td>

      <td className="px-4 py-3 align-middle">
        <p className="text-sm font-medium text-slate-900">{fileName}</p>
        <p
          className="mt-0.5 truncate font-mono text-xs text-slate-400"
          title={filePath}
        >
          {filePath}
        </p>
      </td>

      <td className="px-4 py-3 text-right align-middle text-sm text-slate-600">
        {formatBytes(fileSize)}
      </td>

      <td className="px-4 py-3 align-middle">
        <FileTypeBadge kind={fileKind} />
      </td>
    </tr>
  );
};

export default ClusterFileRow;
