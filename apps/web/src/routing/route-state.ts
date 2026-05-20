import type { AppRouteState, PlaceholderRouteId } from "../navigation/types.ts";
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

  if (normalizedPathname === "/not-authorized") {
    return {
      kind: "not-authorized",
      pathname: "/not-authorized",
      access: "public",
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
        route: getWorkspacePlaceholderRoute(routeId),
        access: "protected",
        authState: "pending",
      };
    }
  }

  return {
    kind: "not-found",
    pathname: normalizedPathname,
    access: "public",
  };
}
