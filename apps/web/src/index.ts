import { renderToStaticMarkup } from "react-dom/server";

import { AppShell } from "./layout/shell";
import { createElement } from "./lib/element";
import { getPlaceholderRoute } from "./routes";
import type { PlaceholderRouteId, RenderedShellOptions } from "./navigation/types";

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

export const webAppScaffold = {
  activeRouteId: "workspace-overview",
  render: renderWebAppShell,
  stylesEntry: "src/styles/global.css",
} as const;
