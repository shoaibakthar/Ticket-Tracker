import { renderToStaticMarkup } from "react-dom/server";

import { loadAppRouteData, type LoadedAppRouteData } from "./data/app-loader.ts";
import { renderNotAuthorizedScreen } from "./routes/not-authorized.ts";
import { renderNotFoundScreen } from "./routes/not-found.ts";
import { renderSharedRouteShell } from "./routes/shared.ts";
import { renderLandingPage } from "./routes/landing.ts";
import { AppShell } from "./layout/shell.ts";
import { createElement } from "./lib/element.ts";
import { getPlaceholderRoute } from "./routes/index.ts";
import { resolveAppRoute } from "./routing/route-state.ts";
import type { AppRouteState, PlaceholderRouteId, RenderedShellOptions } from "./navigation/types.ts";

export function renderWebAppShell(options: RenderedShellOptions = {}): string {
  const workspaceSlug = options.workspaceSlug ?? "demo-workspace";
  const activeRouteId: PlaceholderRouteId = options.activeRouteId ?? "workspace-overview";
  const route = getPlaceholderRoute(activeRouteId);
  const routeState = resolveAppRoute(route.buildPath(workspaceSlug));

  if (routeState.kind !== "workspace") {
    throw new Error("Expected renderWebAppShell to resolve a workspace route.");
  }

  return renderToStaticMarkup(
      createElement(AppShell, {
        workspaceSlug,
        routeState,
        sessionBootstrap: null,
        workspaceOverview: null,
        ticketList: null,
        ticketListError: null,
        ticketDetail: null,
        ticketDetailError: null,
        ticketCommunicationSubmission: null,
        ticketFieldEditSubmission: null,
      }),
  );
}

function renderAppRouteBody(routeState: AppRouteState, loadedData?: LoadedAppRouteData): string {
  switch (routeState.kind) {
    case "marketing":
      return renderToStaticMarkup(renderLandingPage());
    case "workspace":
      return renderToStaticMarkup(
        createElement(AppShell, {
          workspaceSlug: routeState.workspaceSlug,
          routeState,
          sessionBootstrap: loadedData?.sessionBootstrap ?? null,
          workspaceOverview: loadedData?.workspaceOverview ?? null,
          ticketList: loadedData?.ticketList ?? null,
          ticketListError: loadedData?.ticketListError ?? null,
          ticketDetail: loadedData?.ticketDetail ?? null,
          ticketDetailError: loadedData?.ticketDetailError ?? null,
          ticketCommunicationSubmission: loadedData?.ticketCommunicationSubmission ?? null,
          ticketFieldEditSubmission: loadedData?.ticketFieldEditSubmission ?? null,
        }),
      );
    case "shared":
      return renderToStaticMarkup(renderSharedRouteShell(routeState.token));
    case "not-authorized":
      return renderToStaticMarkup(
        renderNotAuthorizedScreen({
          attemptedPath: routeState.attemptedPath,
          missingPermissions: routeState.missingPermissions,
        }),
      );
    case "not-found":
      return renderToStaticMarkup(renderNotFoundScreen(routeState.pathname));
  }
}

function getDocumentTitle(routeState: AppRouteState): string {
  switch (routeState.kind) {
    case "marketing":
      return "ObserveID Ticket Tracker | Operational ticket workflow";
    case "workspace":
      return `${routeState.route.title} | Ticket Tracker`;
    case "shared":
      return "Shared Ticket View | Ticket Tracker";
    case "not-authorized":
      return "Not Authorized | Ticket Tracker";
    case "not-found":
      return "Not Found | Ticket Tracker";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderWebAppDocument(pathname: string): string {
  const routeState = resolveAppRoute(pathname);
  const documentTitle = escapeHtml(getDocumentTitle(routeState));
  const body = renderAppRouteBody(routeState);

  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${documentTitle}</title>`,
    '    <link rel="stylesheet" href="/styles/global.css" />',
    "  </head>",
    `  <body>${body}</body>`,
    "</html>",
  ].join("\n");
}

export function renderLoadedWebAppDocument(loadedData: LoadedAppRouteData): string {
  const documentTitle = escapeHtml(getDocumentTitle(loadedData.routeState));
  const body = renderAppRouteBody(loadedData.routeState, loadedData);

  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${documentTitle}</title>`,
    '    <link rel="stylesheet" href="/styles/global.css" />',
    "  </head>",
    `  <body>${body}</body>`,
    "</html>",
  ].join("\n");
}

export async function renderWebAppDocumentFromApi(
  pathname: string,
  options: {
    readonly apiBaseUrl: string;
    readonly fetchImpl?: typeof fetch;
  },
): Promise<string> {
  return renderLoadedWebAppDocument(
      await loadAppRouteData(pathname, {
        apiBaseUrl: options.apiBaseUrl,
        fetchImpl: options.fetchImpl ?? fetch,
        ticketCommunicationSubmission: null,
        ticketFieldEditSubmission: null,
      }),
    );
}

export const webAppScaffold = {
  activeRouteId: "workspace-overview",
  render: renderWebAppShell,
  renderDocument: renderWebAppDocument,
  renderDocumentFromApi: renderWebAppDocumentFromApi,
  stylesEntry: "src/styles/global.css",
} as const;
