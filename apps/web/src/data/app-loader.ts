import type {
  AppRouteState,
  SessionBootstrapData,
  TicketListData,
  WorkspaceOverviewData,
} from "../navigation/types.ts";
import { applyRouteAuthorizationSnapshot, resolveAppRoute } from "../routing/route-state.ts";
import { readSessionBootstrapResponse, createWorkspaceAuthorizationSnapshot } from "./session.ts";
import { readTicketListResponse } from "./ticket-list.ts";
import { readWorkspaceOverviewResponse } from "./workspace-overview.ts";

interface ResponseLike {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<ResponseLike>;

export interface LoadedAppRouteData {
  readonly routeState: AppRouteState;
  readonly sessionBootstrap: SessionBootstrapData | null;
  readonly workspaceOverview: WorkspaceOverviewData | null;
  readonly ticketList: TicketListData | null;
  readonly ticketListError: string | null;
}

export async function loadAppRouteData(
  pathname: string,
  options: {
    readonly apiBaseUrl: string;
    readonly fetchImpl: FetchLike;
  },
): Promise<LoadedAppRouteData> {
  const initialRouteState = resolveAppRoute(pathname);

  if (initialRouteState.kind !== "workspace") {
    return {
      routeState: initialRouteState,
      sessionBootstrap: null,
      workspaceOverview: null,
      ticketList: null,
      ticketListError: null,
    };
  }

  const sessionResponse = await options.fetchImpl(`${options.apiBaseUrl}/api/v1/session`);
  const sessionBootstrap = readSessionBootstrapResponse(await sessionResponse.json());
  const routeState = applyRouteAuthorizationSnapshot(
    initialRouteState,
    createWorkspaceAuthorizationSnapshot(sessionBootstrap, initialRouteState.workspaceSlug),
  );

  if (routeState.kind !== "workspace") {
    return {
      routeState,
      sessionBootstrap,
      workspaceOverview: null,
      ticketList: null,
      ticketListError: null,
    };
  }

  if (routeState.routeId === "workspace-overview") {
    const overviewResponse = await options.fetchImpl(
      `${options.apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(routeState.workspaceSlug)}/overview`,
    );

    if (overviewResponse.status === 401 || overviewResponse.status === 403) {
      return {
        routeState: {
          kind: "not-authorized",
          pathname: "/not-authorized",
          access: "public",
          attemptedPath: routeState.pathname,
          missingPermissions: routeState.route.requiredPermissions,
        },
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: null,
      };
    }

    if (overviewResponse.status === 404) {
      return {
        routeState: {
          kind: "not-found",
          pathname: routeState.pathname,
          access: "public",
        },
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: null,
      };
    }

    if (!overviewResponse.ok) {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: "Unable to load workspace overview.",
      };
    }

    return {
      routeState,
      sessionBootstrap,
      workspaceOverview: readWorkspaceOverviewResponse(await overviewResponse.json()),
      ticketList: null,
      ticketListError: null,
    };
  }

  if (routeState.routeId === "tickets") {
    const ticketListResponse = await options.fetchImpl(
      `${options.apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(routeState.workspaceSlug)}/tickets`,
    );

    if (ticketListResponse.status === 401 || ticketListResponse.status === 403) {
      return {
        routeState: {
          kind: "not-authorized",
          pathname: "/not-authorized",
          access: "public",
          attemptedPath: routeState.pathname,
          missingPermissions: routeState.route.requiredPermissions,
        },
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: null,
      };
    }

    if (ticketListResponse.status === 404) {
      return {
        routeState: {
          kind: "not-found",
          pathname: routeState.pathname,
          access: "public",
        },
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: null,
      };
    }

    if (!ticketListResponse.ok) {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: "Unable to load tickets for this workspace.",
      };
    }

    return {
      routeState,
      sessionBootstrap,
      workspaceOverview: null,
      ticketList: readTicketListResponse(await ticketListResponse.json()),
      ticketListError: null,
    };
  }

  return {
    routeState,
    sessionBootstrap,
    workspaceOverview: null,
    ticketList: null,
    ticketListError: null,
  };
}
