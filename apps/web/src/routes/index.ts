import { filesRoute } from "./files.ts";
import { membersRoute } from "./members.ts";
import { overviewRoute } from "./overview.ts";
import { pagesRoute } from "./pages.ts";
import { settingsRoute } from "./settings.ts";
import { shareLinksRoute } from "./share-links.ts";
import { ticketsRoute } from "./tickets.ts";

export const workspaceRouteModules = [
  overviewRoute,
  ticketsRoute,
  pagesRoute,
  filesRoute,
  membersRoute,
  shareLinksRoute,
  settingsRoute,
] as const;

export const placeholderRouteModules = workspaceRouteModules;

export function getWorkspacePlaceholderRoute(routeId: (typeof workspaceRouteModules)[number]["id"]) {
  const route = workspaceRouteModules.find((candidate) => candidate.id === routeId);

  if (!route) {
    throw new Error(`Unknown placeholder route: ${routeId}`);
  }

  return route;
}

export const getPlaceholderRoute = getWorkspacePlaceholderRoute;
