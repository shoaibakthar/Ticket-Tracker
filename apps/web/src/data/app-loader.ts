import type {
  AppRouteState,
  SessionBootstrapData,
  TicketDetailData,
  TicketListData,
  WorkspaceOverviewData,
} from "../navigation/types.ts";
import { applyRouteAuthorizationSnapshot, resolveAppRoute } from "../routing/route-state.ts";
import { readSessionBootstrapResponse, createWorkspaceAuthorizationSnapshot } from "./session.ts";
import { readTicketDetailResponse } from "./ticket-detail.ts";
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
  readonly ticketDetail: TicketDetailData | null;
  readonly ticketDetailError: string | null;
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
      ticketDetail: null,
      ticketDetailError: null,
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
      ticketDetail: null,
      ticketDetailError: null,
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
        ticketDetail: null,
        ticketDetailError: null,
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
        ticketDetail: null,
        ticketDetailError: null,
      };
    }

    if (!overviewResponse.ok) {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: "Unable to load workspace overview.",
        ticketDetail: null,
        ticketDetailError: null,
      };
    }

    return {
      routeState,
      sessionBootstrap,
      workspaceOverview: readWorkspaceOverviewResponse(await overviewResponse.json()),
      ticketList: null,
      ticketListError: null,
      ticketDetail: null,
      ticketDetailError: null,
    };
  }

  if (routeState.routeId === "tickets" && routeState.ticketId === null) {
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
        ticketDetail: null,
        ticketDetailError: null,
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
        ticketDetail: null,
        ticketDetailError: null,
      };
    }

    if (!ticketListResponse.ok) {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: "Unable to load tickets for this workspace.",
        ticketDetail: null,
        ticketDetailError: null,
      };
    }

    return {
      routeState,
      sessionBootstrap,
      workspaceOverview: null,
      ticketList: readTicketListResponse(await ticketListResponse.json()),
      ticketListError: null,
      ticketDetail: null,
      ticketDetailError: null,
    };
  }

  if (routeState.routeId === "tickets" && routeState.ticketId) {
    const ticketDetailResponse = await options.fetchImpl(
      `${options.apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(routeState.workspaceSlug)}/tickets/${encodeURIComponent(routeState.ticketId)}`,
    );

    if (ticketDetailResponse.status === 401 || ticketDetailResponse.status === 403) {
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
        ticketDetail: null,
        ticketDetailError: null,
      };
    }

    if (ticketDetailResponse.status === 404) {
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
        ticketDetail: null,
        ticketDetailError: null,
      };
    }

    if (!ticketDetailResponse.ok) {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: null,
        ticketDetail: null,
        ticketDetailError: "Unable to load this ticket.",
      };
    }

    return {
      routeState,
      sessionBootstrap,
      workspaceOverview: null,
      ticketList: null,
      ticketListError: null,
      ticketDetail: readTicketDetailResponse(await ticketDetailResponse.json()),
      ticketDetailError: null,
    };
  }

  return {
    routeState,
    sessionBootstrap,
    workspaceOverview: null,
    ticketList: null,
    ticketListError: null,
    ticketDetail: null,
    ticketDetailError: null,
  };
}
