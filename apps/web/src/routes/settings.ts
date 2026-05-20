import type { ReactElement } from "react";

import { ScreenPlaceholder } from "../components/screen-placeholder";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types";

function renderSettingsScreen({ workspaceSlug }: PlaceholderScreenProps): ReactElement {
  return ScreenPlaceholder({
    workspaceSlug,
    routePath: `/workspaces/${workspaceSlug}/settings`,
    title: "Settings",
    description: "A grouped administrative shell for workspace configuration, intentionally limited until permission-aware settings are defined.",
    bodyTitle: "Workspace settings shell",
    bodyDescription: "Configuration sections will be added here later based on role and permission. This placeholder keeps the route shape and admin context stable.",
  });
}

export const settingsRoute: PlaceholderRouteModule = {
  id: "settings",
  pathTemplate: "/workspaces/:workspaceSlug/settings",
  title: "Settings",
  summary: "Provide a stable workspace-level administration entry point.",
  navigationLabel: "Settings",
  placeholder: true,
  buildPath: (workspaceSlug) => `/workspaces/${workspaceSlug}/settings`,
  renderScreen: renderSettingsScreen,
};
