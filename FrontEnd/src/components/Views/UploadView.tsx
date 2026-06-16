import { useTranslation } from 'react-i18next'
import FolderUploader from '../FolderUploader'
import TrustPoints from '../TrustPoints'

const UploadView = () => {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center py-12 text-center">

      <h1 className="max-w-3xl font-['Sora'] text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
        {t('uploadView.title')}
      </h1>

      <p className="mt-4 max-w-xl text-base text-slate-500">
        {t('uploadView.support')}
      </p>

      <div className="mt-8 w-full px-12">
        <FolderUploader />
      </div>

      <div className="mt-8 w-full">
        <TrustPoints />
      </div>
    </div>
  )
}

export default UploadView
