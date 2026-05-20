import type { ReactElement } from "react";

import { ScreenPlaceholder } from "../components/screen-placeholder";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types";

function renderOverviewScreen({ workspaceSlug }: PlaceholderScreenProps): ReactElement {
  return ScreenPlaceholder({
    workspaceSlug,
    routePath: `/workspaces/${workspaceSlug}/overview`,
    title: "Overview",
    description: "A calm workspace home for orientation, summary context, and quick movement into core areas.",
    bodyTitle: "Workspace overview shell",
    bodyDescription: "Summary cards, recent activity, and quick links land here later. This scaffold keeps the workspace context explicit and trustworthy.",
  });
}

export const overviewRoute: PlaceholderRouteModule = {
  id: "workspace-overview",
  pathTemplate: "/workspaces/:workspaceSlug/overview",
  title: "Workspace Overview",
  summary: "Orient the user within a workspace and provide a trustworthy home base.",
  navigationLabel: "Overview",
  placeholder: true,
  buildPath: (workspaceSlug) => `/workspaces/${workspaceSlug}/overview`,
  renderScreen: renderOverviewScreen,
};
