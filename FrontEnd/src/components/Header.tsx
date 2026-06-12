import Logo from "../assets/icons/ReplicaLogoAlt.png"
import { useTranslation } from "react-i18next"

const Header = () => {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-10 w-full border-b border-blue-100 bg-white">
      <div className="flex items-center justify-between py-2 lg:px-16 px-4">
        <div className="flex flex-col items-center gap-0 hover:brightness-125 transition-all duration-100">
          <img
            src={Logo}
            alt={`${t("global.appName")} logo`}
            className="h-9 w-auto object-contain"
          />
          <h1 className="font-['Sora'] text-base font-semibold tracking-tight text-blue-600">
            {t('global.appName')}
          </h1>
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {t('header.feedback')}
        </button>
      </div>
    </header>
  )
}

export default Header
