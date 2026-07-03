import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { setSelectedFolderPath } from '../reducers/files';
import { useAppDispatch, useAppSelector } from '../store/store';

const FolderIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
);

const FolderSelector = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const pathInputRef = useRef<HTMLInputElement>(null);
  const selectedFolderPath = useAppSelector(
    (state) => state.files.selectedFolderPath,
  );
  

  const handlePathChange = (value: string) => {
    const trimmed = value.trim();
    dispatch(setSelectedFolderPath(trimmed || null));
  };

  const handleBrowse = async () => {
    if (window.electron?.selectFolder) {
      const folderPath = await window.electron.selectFolder();
      if (folderPath) {
        dispatch(setSelectedFolderPath(folderPath));
      }
      return;
    }

    pathInputRef.current?.focus();
  };

  return (
    <section
      className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label={t('folderSelector.ariaLabel')}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <FolderIcon />
        </span>

        {selectedFolderPath && (
          <div className="w-full">
            <p className="text-sm font-medium text-slate-500">
              {t('folderSelector.selectedLabel')}
            </p>
            <p
              className="mt-1 truncate font-mono text-sm text-slate-900"
              title={selectedFolderPath}
            >
              {selectedFolderPath}
            </p>
          </div>
        )}

        <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t('folderSelector.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('folderSelector.description')}
            </p>
          </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <input
            ref={pathInputRef}
            type="text"
            value={selectedFolderPath ?? ''}
            onChange={(event) => handlePathChange(event.target.value)}
            placeholder={t('folderSelector.pathPlaceholder')}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <Button
            variant="secondary"
            size="md"
            className="shrink-0"
            onClick={handleBrowse}
          >
            {t('folderSelector.browseButton')}
          </Button>
        </div>

        <p className="text-xs text-slate-400">
          {t('folderSelector.localNote')}
        </p>
      </div>
    </section>
  );
};

export default FolderSelector;
