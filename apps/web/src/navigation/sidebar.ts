import { placeholderRouteModules } from "../routes/index.ts";
import type { PlaceholderRouteId, SidebarNavigationSection } from "./types.ts";

const routeMap = Object.fromEntries(placeholderRouteModules.map((route) => [route.id, route])) as Record<
  (typeof placeholderRouteModules)[number]["id"],
  (typeof placeholderRouteModules)[number]
>;

function createNavigationItem(workspaceSlug: string, activeRouteId: PlaceholderRouteId, routeId: PlaceholderRouteId) {
  const route = routeMap[routeId];

  return {
    routeId,
    label: route.navigationLabel,
    href: route.buildPath(workspaceSlug),
    current: routeId === activeRouteId,
  } as const;
}

export function buildSidebarNavigation(
  workspaceSlug: string,
  activeRouteId: PlaceholderRouteId,
): readonly SidebarNavigationSection[] {
  return [
    {
      id: "workspace",
      title: "Workspace",
      items: [
        createNavigationItem(workspaceSlug, activeRouteId, "workspace-overview"),
        createNavigationItem(workspaceSlug, activeRouteId, "tickets"),
        createNavigationItem(workspaceSlug, activeRouteId, "pages"),
        createNavigationItem(workspaceSlug, activeRouteId, "files"),
      ],
    },
    {
      id: "collaboration",
      title: "Collaboration / Access",
      items: [
        createNavigationItem(workspaceSlug, activeRouteId, "members"),
        createNavigationItem(workspaceSlug, activeRouteId, "share-links"),
      ],
    },
    {
      id: "administration",
      title: "Administration",
      items: [createNavigationItem(workspaceSlug, activeRouteId, "settings")],
    },
  ] as const;
}
