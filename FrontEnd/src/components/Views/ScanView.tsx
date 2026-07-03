import { useTranslation } from 'react-i18next'
import FolderSelector from '../FolderSelector'
import TrustPoints from '../TrustPoints'
import Button from '../Button'
import { useAppSelector } from '../../store/store'
import { useAppDispatch } from '../../store/store'
import { setSelectedFolderPath } from '../../reducers/files'
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../models/constant";


const ScanView = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedFolderPath = useAppSelector((state) => state.files.selectedFolderPath);
  const navigate = useNavigate();

  const handleScan = () => {

    navigate(ROUTES.RESULTS);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center py-12 text-center">

      <h1 className="max-w-3xl font-['Sora'] text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
        {t('scanView.title')}
      </h1>

      <p className="mt-4 max-w-xl text-base text-slate-500">
        {t('scanView.support')}
      </p>

      <div className="mt-8 w-full px-12">
        <FolderSelector />
      </div>

      <div className="mt-4 w-full px-12 flex justify-between">
        <Button
          variant="secondary"
          size="md"
          disabled={!selectedFolderPath}
          onClick={() => dispatch(setSelectedFolderPath(null))}
        >
          {t('scanView.clearButton')}
        </Button>
        <Button 
        variant="primary" 
        size="md" 
        disabled={!selectedFolderPath}
        onClick={handleScan}>
          {t('scanView.scanButton')}
        </Button>
      </div>

      <div className="mt-4 w-full">
        <TrustPoints />
      </div>
    </div>
  )
}

export default ScanView
