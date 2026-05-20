import type { ReactElement } from "react";

import { ScreenPlaceholder } from "../components/screen-placeholder.ts";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types.ts";

function renderPagesScreen({ workspaceSlug }: PlaceholderScreenProps): ReactElement {
  return ScreenPlaceholder({
    workspaceSlug,
    routePath: `/workspaces/${workspaceSlug}/pages`,
    title: "Pages",
    description: "An MVP-safe entry into workspace documentation, keeping page tree and editor depth deferred.",
    primaryActionLabel: "Create Page",
    bodyTitle: "Pages root shell",
    bodyDescription: "Use this screen as the calm entry point for page list or page tree UI before TipTap and richer editing behaviors arrive.",
  });
}

export const pagesRoute: PlaceholderRouteModule = {
  id: "pages",
  pathTemplate: "/workspaces/:workspaceSlug/pages",
  title: "Pages",
  summary: "Enter workspace pages and documentation without implying final editor behavior yet.",
  navigationLabel: "Pages",
  placeholder: true,
  buildPath: (workspaceSlug) => `/workspaces/${workspaceSlug}/pages`,
  renderScreen: renderPagesScreen,
};
