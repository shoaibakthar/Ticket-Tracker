import { placeholderRouteModules } from "../routes";
import type { SidebarNavigationSection } from "./types";

const routeMap = Object.fromEntries(placeholderRouteModules.map((route) => [route.id, route])) as Record<
  (typeof placeholderRouteModules)[number]["id"],
  (typeof placeholderRouteModules)[number]
>;

export const sidebarNavigation: readonly SidebarNavigationSection[] = [
  {
    id: "workspace",
    title: "Workspace",
    items: [
      {
        routeId: "workspace-overview",
        label: "Overview",
        href: routeMap["workspace-overview"].path,
      },
      {
        routeId: "tickets",
        label: "Tickets",
        href: routeMap.tickets.path,
      },
      {
        routeId: "pages",
        label: "Pages",
        href: routeMap.pages.path,
      },
      {
        routeId: "files",
        label: "Files",
        href: routeMap.files.path,
      },
    ],
  },
  {
    id: "collaboration",
    title: "Collaboration",
    items: [
      {
        routeId: "members",
        label: "Members",
        href: routeMap.members.path,
      },
      {
        routeId: "share-links",
        label: "Share Links",
        href: routeMap["share-links"].path,
      },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    items: [
      {
        routeId: "settings",
        label: "Settings",
        href: routeMap.settings.path,
      },
    ],
  },
] as const;
