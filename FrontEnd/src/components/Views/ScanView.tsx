import { useTranslation } from 'react-i18next'
import FolderSelector from '../FolderSelector'
import Button from '../Button'
import { useAppSelector, useAppDispatch } from '../../store/store'
import { scanFolder, setSelectedFolderPath } from '../../reducers/files'
import { useNavigate } from "react-router-dom"
import { ROUTES } from "../../models/constant"

const ScanView = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedFolderPath = useAppSelector((state) => state.files.selectedFolderPath);
  const error = useAppSelector((state) => state.files.error);
  const navigate = useNavigate();

  const handleScan = async () => {
    if (!selectedFolderPath) return;

    dispatch(scanFolder(selectedFolderPath));
    dispatch(setSelectedFolderPath(null));
    navigate(ROUTES.DUPLICATES);
  };

  return (
    <div className="relative m-auto flex w-full max-w-4xl flex-col items-center py-12 text-center">

      <h1 className="max-w-3xl font-['Sora'] text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
        {t('scanView.title')}
      </h1>

      <p className="mt-4 max-w-xl text-base text-slate-500">
        {t('scanView.support')}
      </p>

      <div className="mt-8 w-full px-12">
        <FolderSelector />
      </div>

      {error && (
        <p className="mt-4 px-12 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 w-full px-12 flex justify-end">
        <Button
          variant="primary"
          size="md"
          disabled={!selectedFolderPath}
          onClick={handleScan}
        >
          {t('scanView.scanButton')}
        </Button>
      </div>
    </div>
  )
}

export default ScanView
