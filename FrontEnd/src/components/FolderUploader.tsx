import { useTranslation } from 'react-i18next';

const FolderUploader = () => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="group relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm transition hover:border-blue-400 hover:shadow-md"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-blue-50/40 opacity-0 transition-opacity group-hover:opacity-100"
      />

      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </span>

      <span className="relative">
        <span className="block text-base font-semibold text-slate-900">
          {t('folderUploader.title')}
        </span>
        <span className="mt-1 block text-sm text-slate-500">
          {t('folderUploader.description')}
        </span>
      </span>

      <span className="relative mt-1 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition group-hover:bg-blue-700">
        {t('folderUploader.uploadButton')}
      </span>
    </button>
  );
};

export default FolderUploader
