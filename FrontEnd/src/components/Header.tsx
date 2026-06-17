import Logo from "../assets/icons/ReplicaLogoAlt.png"
import { useTranslation } from "react-i18next"
import Button from "./Button"

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

        <Button variant="primary" size="md">
          {t('header.feedback')}
        </Button>
      </div>
    </header>
  )
}

export default Header
