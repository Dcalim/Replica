
export const APP_NAME = "Replica"

export const ROUTES = {
  SCAN: "/",
  DUPLICATES: "/duplicates",
  DASHBOARD: "/dashboard",
  HISTORY: "/history",
} as const;

export const MODAL_VIEWS = {
  NONE: "none",
  SETTINGS: "settings",
} as const;


export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
export type ModalView = typeof MODAL_VIEWS[keyof typeof MODAL_VIEWS];