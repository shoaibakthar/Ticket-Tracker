import type {
  AppRouteState,
  PlaceholderRouteId,
  RouteAuthorizationSnapshot,
  WorkspaceRouteState,
} from "../navigation/types.ts";
import { getWorkspacePlaceholderRoute } from "../routes/index.ts";

const workspaceRouteSegmentToId = {
  overview: "workspace-overview",
  tickets: "tickets",
  pages: "pages",
  files: "files",
  members: "members",
  "share-links": "share-links",
  settings: "settings",
} as const satisfies Record<string, PlaceholderRouteId>;

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const trimmed = pathname.trim();

  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  const withLeadingSlash = withoutTrailingSlash.startsWith("/") ? withoutTrailingSlash : `/${withoutTrailingSlash}`;

  return withLeadingSlash || "/";
}

export function resolveAppRoute(pathname: string): AppRouteState {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/") {
    return {
      kind: "marketing",
      pathname: "/",
      access: "public",
    };
  }

  if (normalizedPathname === "/not-authorized") {
      return {
        kind: "not-authorized",
        pathname: "/not-authorized",
        access: "public",
        attemptedPath: null,
        missingPermissions: [],
      };
  }

  const sharedMatch = normalizedPathname.match(/^\/shared\/([^/]+)$/);

  if (sharedMatch?.[1]) {
    return {
      kind: "shared",
      pathname: normalizedPathname,
      token: decodeURIComponent(sharedMatch[1]),
      access: "shared",
    };
  }

  const ticketDetailMatch = normalizedPathname.match(/^\/workspaces\/([^/]+)\/tickets\/([^/]+)$/);

  if (ticketDetailMatch?.[1] && ticketDetailMatch[2]) {
    const workspaceSlug = decodeURIComponent(ticketDetailMatch[1]);
    const ticketId = decodeURIComponent(ticketDetailMatch[2]);
    const route = getWorkspacePlaceholderRoute("tickets");

    return {
      kind: "workspace",
      pathname: normalizedPathname,
      workspaceSlug,
      routeId: "tickets",
      ticketId,
      route,
      access: "protected",
      authState: "pending",
      routeGuard: {
        strategy: "authenticated-workspace-membership",
        fallbackPath: "/not-authorized",
        requiredPermissions: route.requiredPermissions,
      },
      authorization: {
        sessionState: "pending",
        permissionState: "pending",
        missingPermissions: [],
      },
    };
  }

  const workspaceMatch = normalizedPathname.match(/^\/workspaces\/([^/]+)\/([^/]+)$/);

  if (workspaceMatch?.[1] && workspaceMatch[2]) {
    const workspaceSlug = decodeURIComponent(workspaceMatch[1]);
    const routeId = workspaceRouteSegmentToId[workspaceMatch[2] as keyof typeof workspaceRouteSegmentToId];

    if (routeId) {
      return {
        kind: "workspace",
        pathname: normalizedPathname,
        workspaceSlug,
        routeId,
        ticketId: null,
        route: getWorkspacePlaceholderRoute(routeId),
        access: "protected",
        authState: "pending",
        routeGuard: {
          strategy: "authenticated-workspace-membership",
          fallbackPath: "/not-authorized",
          requiredPermissions: getWorkspacePlaceholderRoute(routeId).requiredPermissions,
        },
        authorization: {
          sessionState: "pending",
          permissionState: "pending",
          missingPermissions: [],
        },
      };
    }
  }

  return {
    kind: "not-found",
    pathname: normalizedPathname,
    access: "public",
  };
}

export function applyRouteAuthorizationSnapshot(
  routeState: AppRouteState,
  snapshot: RouteAuthorizationSnapshot,
): AppRouteState {
  if (routeState.kind !== "workspace") {
    return routeState;
  }

  if (snapshot.sessionState !== "authenticated") {
    return routeState;
  }

  const missingPermissions = routeState.routeGuard.requiredPermissions.filter(
    (requiredPermission) => !snapshot.grantedPermissions.includes(requiredPermission),
  );

  if (missingPermissions.length > 0) {
    return {
      kind: "not-authorized",
      pathname: "/not-authorized",
      access: "public",
      attemptedPath: routeState.pathname,
      missingPermissions,
    };
  }

  return {
    ...routeState,
    authorization: buildAuthorizedPlaceholder(routeState),
  };
}

function buildAuthorizedPlaceholder(routeState: WorkspaceRouteState) {
  return {
    sessionState: "authenticated",
    permissionState: "authorized",
    missingPermissions: routeState.authorization.missingPermissions,
  } as const;
}
