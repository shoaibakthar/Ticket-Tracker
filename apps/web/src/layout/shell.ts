import { sidebarNavigation } from "../navigation/sidebar";
import { topbar } from "./topbar";
import { placeholderRouteModules } from "../routes";

export const appShell = {
  appName: "ObserveID Ticket Tracker",
  phase: "application-shell",
  status: "placeholder",
  sidebar: sidebarNavigation,
  topbar,
  routeCount: placeholderRouteModules.length,
} as const;
