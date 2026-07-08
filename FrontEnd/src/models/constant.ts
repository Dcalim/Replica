
export const APP_NAME = "Replica"

export const ROUTES = {
  SCAN: "/",
  DUPLICATES: "/duplicates",
  DASHBOARD: "/dashboard",
  HISTORY: "/history",
  RESULTS: "/results",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
