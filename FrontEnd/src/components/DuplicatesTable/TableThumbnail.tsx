import { useState } from "react";
import {
  HiOutlineDocument,
  HiOutlineFilm,
  HiOutlinePhoto,
} from "react-icons/hi2";
import apiService from "../../services/apiService";
import { getFileKind, isImageFile } from "../../utils/fileHelpers";

const FileTypeIcon = ({ filePath }: { filePath: string }) => {
  const kind = getFileKind(filePath);

  if (kind === "image") {
    return <HiOutlinePhoto className="size-5 text-blue-600" aria-hidden />;
  }

  if (kind === "video") {
    return <HiOutlineFilm className="size-5 text-violet-600" aria-hidden />;
  }

  return <HiOutlineDocument className="size-5 text-slate-500" aria-hidden />;
};

type TableThumbnailProps = {
  filePath: string;
};

const TableThumbnail = ({ filePath }: TableThumbnailProps) => {
  const [failed, setFailed] = useState(false);

  if (!isImageFile(filePath) || failed) {
    return (
      <span className="flex size-11 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
        <FileTypeIcon filePath={filePath} />
      </span>
    );
  }

  return (
    <img
      src={apiService.getFilePreviewUrl(filePath)}
      alt=""
      className="size-11 rounded-lg object-cover ring-1 ring-slate-200"
      onError={() => setFailed(true)}
    />
  );
};

export default TableThumbnail;
