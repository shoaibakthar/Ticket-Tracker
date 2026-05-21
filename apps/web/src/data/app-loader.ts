import type {
  AppRouteState,
  SessionBootstrapData,
  TicketCommunicationSubmissionState,
  TicketFieldEditSubmissionState,
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
  readonly ticketCommunicationSubmission: TicketCommunicationSubmissionState | null;
  readonly ticketFieldEditSubmission: TicketFieldEditSubmissionState | null;
}

export async function loadAppRouteData(
  requestedPath: string,
  options: {
    readonly apiBaseUrl: string;
    readonly fetchImpl: FetchLike;
    readonly ticketCommunicationSubmission?: TicketCommunicationSubmissionState | null;
    readonly ticketFieldEditSubmission?: TicketFieldEditSubmissionState | null;
  },
): Promise<LoadedAppRouteData> {
  const ticketCommunicationSubmission = options.ticketCommunicationSubmission ?? null;
  const ticketFieldEditSubmission = options.ticketFieldEditSubmission ?? null;
  const requestUrl = new URL(requestedPath, "http://localhost");
  const initialRouteState = resolveAppRoute(requestUrl.pathname);

  if (initialRouteState.kind !== "workspace") {
    return {
      routeState: initialRouteState,
      sessionBootstrap: null,
      workspaceOverview: null,
      ticketList: null,
      ticketListError: null,
      ticketDetail: null,
      ticketDetailError: null,
      ticketCommunicationSubmission,
      ticketFieldEditSubmission,
    };
  }

  const sessionResponse = await options.fetchImpl(`${options.apiBaseUrl}/api/v1/session`);
  let sessionBootstrap: SessionBootstrapData;

  try {
    sessionBootstrap = readSessionBootstrapResponse(await sessionResponse.json());
  } catch {
    return {
      routeState: {
        kind: "not-authorized",
        pathname: "/not-authorized",
        access: "public",
        attemptedPath: initialRouteState.pathname,
        missingPermissions: initialRouteState.route.requiredPermissions,
      },
      sessionBootstrap: null,
      workspaceOverview: null,
      ticketList: null,
      ticketListError: null,
      ticketDetail: null,
      ticketDetailError: null,
      ticketCommunicationSubmission,
      ticketFieldEditSubmission,
    };
  }
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
      ticketCommunicationSubmission,
      ticketFieldEditSubmission,
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
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
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
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
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
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
      };
    }

    try {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: readWorkspaceOverviewResponse(await overviewResponse.json()),
        ticketList: null,
        ticketListError: null,
        ticketDetail: null,
        ticketDetailError: null,
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
      };
    } catch {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: "Unable to load workspace overview.",
        ticketDetail: null,
        ticketDetailError: null,
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
      };
    }
  }

  if (routeState.routeId === "tickets" && routeState.ticketId === null) {
    const ticketListResponse = await options.fetchImpl(
      `${options.apiBaseUrl}/api/v1/workspaces/${encodeURIComponent(routeState.workspaceSlug)}/tickets${requestUrl.search}`,
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
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
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
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
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
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
      };
    }

    try {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: readTicketListResponse(await ticketListResponse.json()),
        ticketListError: null,
        ticketDetail: null,
        ticketDetailError: null,
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
      };
    } catch {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: "Unable to load tickets for this workspace.",
        ticketDetail: null,
        ticketDetailError: null,
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
      };
    }
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
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
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
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
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
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
      };
    }

    try {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: null,
        ticketDetail: readTicketDetailResponse(await ticketDetailResponse.json()),
        ticketDetailError: null,
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
      };
    } catch {
      return {
        routeState,
        sessionBootstrap,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: null,
        ticketDetail: null,
        ticketDetailError: "Unable to load this ticket.",
        ticketCommunicationSubmission,
        ticketFieldEditSubmission,
      };
    }
  }

  return {
    routeState,
    sessionBootstrap,
    workspaceOverview: null,
    ticketList: null,
    ticketListError: null,
    ticketDetail: null,
    ticketDetailError: null,
    ticketCommunicationSubmission,
    ticketFieldEditSubmission,
  };
}
