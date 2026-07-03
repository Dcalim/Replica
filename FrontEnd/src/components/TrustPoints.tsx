import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type TrustPointKey = 'desktop' | 'detection' | 'review'

type TrustPoint = {
  key: TrustPointKey
  icon: ReactNode
  iconClass: string
}

const trustPoints: TrustPoint[] = [
  {
    key: 'desktop',
    iconClass: 'bg-emerald-50 text-emerald-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    key: 'detection',
    iconClass: 'bg-blue-50 text-blue-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    key: 'review',
    iconClass: 'bg-violet-50 text-violet-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

const TrustPoints = () => {
  const { t } = useTranslation()

  return (
    <section
      className="mt-8 w-full"
      aria-label={t('trustPoints.ariaLabel')}
    >
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
        {trustPoints.map(({ key, icon, iconClass }) => (
          <li key={key} className="flex gap-3 text-left">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
              {icon}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {t(`trustPoints.${key}.title`)}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {t(`trustPoints.${key}.description`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default TrustPoints
