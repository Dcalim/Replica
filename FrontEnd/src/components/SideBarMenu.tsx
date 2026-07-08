import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiOutlineClock,
  HiOutlineDocumentDuplicate,
  HiOutlineFolderOpen,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { IoSettingsOutline } from "react-icons/io5";
import Logo from "../assets/icons/ReplicaLogoAlt.png";
import Button from "./Button";
import { ROUTES, type AppRoute } from "../models/constant";
import { useAppDispatch } from "../store/store";
import { setModalView } from "../reducers/ui";
import { MODAL_VIEWS } from "../models/constant";

type NavItem = {
  route: AppRoute;
  labelKey: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    route: ROUTES.SCAN,
    labelKey: "sidebar.scan",
    icon: <HiOutlineFolderOpen className="size-5 shrink-0" aria-hidden />,
  },
  {
    route: ROUTES.DUPLICATES,
    labelKey: "sidebar.duplicates",
    icon: <HiOutlineDocumentDuplicate className="size-5 shrink-0" aria-hidden />,
  },
  {
    route: ROUTES.DASHBOARD,
    labelKey: "sidebar.dashboard",
    icon: <HiOutlineSquares2X2 className="size-5 shrink-0" aria-hidden />,
  },
  {
    route: ROUTES.HISTORY,
    labelKey: "sidebar.history",
    icon: <HiOutlineClock className="size-5 shrink-0" aria-hidden />,
  },
];

const SideBarMenu = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const itemClass = (isActive: boolean) =>
    [
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
      isActive
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    ].join(" ");

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 flex h-screen w-56 flex-col border-r border-slate-200 bg-white"
      aria-label={t("sidebar.ariaLabel")}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-4">
        <img
          src={Logo}
          alt={`${t("global.appName")} logo`}
          className="h-8 w-8 shrink-0 object-contain"
        />
        <span className="truncate font-['Sora'] text-sm font-semibold text-blue-600">
          {t("global.appName")}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {navItems.map(({ route, labelKey, icon }) => (
          <NavLink
            key={route}
            to={route}
            end={route === ROUTES.SCAN}
            className={({ isActive }) => itemClass(isActive)}
          >
            {icon}
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-2">
        <Button
          variant="clear"
          size="md"
          className="w-full justify-start gap-3 px-3"
          ariaLabel={t("header.settings")}
          onClick={() => dispatch(setModalView(MODAL_VIEWS.SETTINGS))}
        >
          <IoSettingsOutline className="size-5 shrink-0 text-slate-700" aria-hidden />
          <span className="text-sm text-slate-600">{t("header.settings")}</span>
        </Button>
      </div>
    </aside>
  );
};

export default SideBarMenu;

export const SIDEBAR_MARGIN = "ml-56";
