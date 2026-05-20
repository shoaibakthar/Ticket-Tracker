import { placeholderRouteModules } from "../routes/index.ts";
import type {
  PlaceholderRouteId,
  SessionBootstrapData,
  SidebarNavigationSection,
  WorkspaceSwitcherItem,
} from "./types.ts";

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

function hasAllPermissions(
  grantedPermissions: readonly string[] | null,
  requiredPermissions: readonly string[],
): boolean {
  if (!grantedPermissions) {
    return true;
  }

  return requiredPermissions.every((requiredPermission) => grantedPermissions.includes(requiredPermission));
}

export function buildSidebarNavigation(
  workspaceSlug: string,
  activeRouteId: PlaceholderRouteId,
  sessionBootstrap: SessionBootstrapData | null,
): readonly SidebarNavigationSection[] {
  const currentWorkspace = sessionBootstrap?.workspaces.find((workspace) => workspace.workspaceSlug === workspaceSlug) ?? null;
  const currentWorkspacePermissions = currentWorkspace?.grantedPermissions ?? null;
  const visibleRouteIds = placeholderRouteModules
    .filter((route) => hasAllPermissions(currentWorkspacePermissions, route.requiredPermissions))
    .map((route) => route.id);

  return [
    {
      id: "workspace",
      title: "Workspace",
      items: [
        ...visibleRouteIds
          .filter((routeId) =>
            routeId === "workspace-overview" || routeId === "tickets" || routeId === "pages" || routeId === "files",
          )
          .map((routeId) => createNavigationItem(workspaceSlug, activeRouteId, routeId)),
      ] as const,
    },
    {
      id: "collaboration",
      title: "Collaboration / Access",
      items: [
        ...visibleRouteIds
          .filter((routeId) => routeId === "members" || routeId === "share-links")
          .map((routeId) => createNavigationItem(workspaceSlug, activeRouteId, routeId)),
      ] as const,
    },
    {
      id: "administration",
      title: "Administration",
      items: visibleRouteIds
        .filter((routeId) => routeId === "settings")
        .map((routeId) => createNavigationItem(workspaceSlug, activeRouteId, routeId)),
    },
  ].filter((section) => section.items.length > 0) as readonly SidebarNavigationSection[];
}

export function buildWorkspaceSwitcherItems(
  activeRouteId: PlaceholderRouteId,
  sessionBootstrap: SessionBootstrapData | null,
  currentWorkspaceSlug: string,
): readonly WorkspaceSwitcherItem[] {
  if (!sessionBootstrap) {
    return [];
  }

  return sessionBootstrap.workspaces.map((workspace) => {
    const activeRoute = routeMap[activeRouteId];
    const fallbackRoute =
      placeholderRouteModules.find((route) => hasAllPermissions(workspace.grantedPermissions, route.requiredPermissions)) ??
      routeMap["workspace-overview"];
    const href = hasAllPermissions(workspace.grantedPermissions, activeRoute.requiredPermissions)
      ? activeRoute.buildPath(workspace.workspaceSlug)
      : fallbackRoute.buildPath(workspace.workspaceSlug);

    return {
      workspaceSlug: workspace.workspaceSlug,
      workspaceName: workspace.workspaceName,
      href,
      current: workspace.workspaceSlug === currentWorkspaceSlug,
    };
  });
}
