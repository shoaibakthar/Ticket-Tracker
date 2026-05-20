import { renderToStaticMarkup } from "react-dom/server";

import { renderNotAuthorizedScreen } from "./routes/not-authorized.ts";
import { renderNotFoundScreen } from "./routes/not-found.ts";
import { renderSharedRouteShell } from "./routes/shared.ts";
import { AppShell } from "./layout/shell.ts";
import { createElement } from "./lib/element.ts";
import { getPlaceholderRoute } from "./routes/index.ts";
import { resolveAppRoute } from "./routing/route-state.ts";
import type { AppRouteState, PlaceholderRouteId, RenderedShellOptions } from "./navigation/types.ts";

export function renderWebAppShell(options: RenderedShellOptions = {}): string {
  const workspaceSlug = options.workspaceSlug ?? "demo-workspace";
  const activeRouteId: PlaceholderRouteId = options.activeRouteId ?? "workspace-overview";
  const route = getPlaceholderRoute(activeRouteId);

  return renderToStaticMarkup(
    createElement(AppShell, {
      workspaceSlug,
      route,
    }),
  );
}

function renderAppRouteBody(routeState: AppRouteState): string {
  switch (routeState.kind) {
    case "workspace":
      return renderToStaticMarkup(
        createElement(AppShell, {
          workspaceSlug: routeState.workspaceSlug,
          route: routeState.route,
        }),
      );
    case "shared":
      return renderToStaticMarkup(renderSharedRouteShell(routeState.token));
    case "not-authorized":
      return renderToStaticMarkup(renderNotAuthorizedScreen());
    case "not-found":
      return renderToStaticMarkup(renderNotFoundScreen(routeState.pathname));
  }
}

function getDocumentTitle(routeState: AppRouteState): string {
  switch (routeState.kind) {
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

export const webAppScaffold = {
  activeRouteId: "workspace-overview",
  render: renderWebAppShell,
  renderDocument: renderWebAppDocument,
  stylesEntry: "src/styles/global.css",
} as const;
