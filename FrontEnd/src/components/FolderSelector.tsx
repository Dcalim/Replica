import { useTranslation } from 'react-i18next';
import Button from './Button';
import { setSelectedFolderPath } from '../reducers/files';
import { useAppDispatch, useAppSelector } from '../store/store';
import { TbFolder, TbFolderPlus } from 'react-icons/tb';

const getFolderName = (path: string) => {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts.at(-1) ?? path;
};

const FolderSelector = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const store = useAppSelector(state => state);
  console.log(store);

  const selectedFolderPath = useAppSelector(
    (state) => state.files.selectedFolderPath,
  );

  const handleBrowse = async () => {
    if (window.electron?.selectFolder) {
      const folderPath = await window.electron.selectFolder();
      if (folderPath) {
        dispatch(setSelectedFolderPath(folderPath));
      }
    }
  };

  const handleClear = () => {
    dispatch(setSelectedFolderPath(null));
  };

  if (selectedFolderPath) {
    const folderName = getFolderName(selectedFolderPath);

    return (
      <section
        className="w-full rounded-2xl border-2 border-blue-400 bg-blue-50/40 px-6 py-8 shadow-sm ring-4 ring-blue-100/60"
        aria-label={t('folderSelector.ariaLabel')}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <TbFolder className="size-7" aria-hidden />
          </span>

          <div className="w-full max-w-xl">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('folderSelector.selectedLabel')}
            </p>
            <h2 className="mt-1 font-['Sora'] text-xl font-semibold text-slate-900">
              {folderName}
            </h2>
            <p
              className="mt-2 truncate rounded-lg bg-white/80 px-3 py-2 font-mono text-sm text-slate-600 ring-1 ring-blue-200"
              title={selectedFolderPath}
            >
              {selectedFolderPath}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button variant="primary" size="md" onClick={handleBrowse}>
              {t('folderSelector.changeButton')}
            </Button>
            <Button variant="secondary" size="md" onClick={handleClear}>
              {t('folderSelector.removeButton')}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/20"
      aria-label={t('folderSelector.ariaLabel')}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <TbFolderPlus className="size-7" aria-hidden />
        </span>

        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {t('folderSelector.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('folderSelector.description')}
          </p>
        </div>

        <div className="flex w-full justify-center pt-4">
          <Button variant="primary" size="md" onClick={handleBrowse}>
            {t('folderSelector.browseButton')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FolderSelector;
