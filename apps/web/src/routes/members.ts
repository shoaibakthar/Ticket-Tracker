import type { ReactElement } from "react";

import { ScreenPlaceholder } from "../components/screen-placeholder";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types";

function renderMembersScreen({ workspaceSlug }: PlaceholderScreenProps): ReactElement {
  return ScreenPlaceholder({
    workspaceSlug,
    routePath: `/workspaces/${workspaceSlug}/members`,
    title: "Members",
    description: "A role-and-status-focused access surface that makes membership management easy to understand.",
    primaryActionLabel: "Invite Member",
    bodyTitle: "Members list shell",
    bodyDescription: "Role display, invite flow entry, and deactivation controls will live here once permission-aware membership flows are implemented.",
  });
}

export const membersRoute: PlaceholderRouteModule = {
  id: "members",
  pathTemplate: "/workspaces/:workspaceSlug/members",
  title: "Members",
  summary: "Manage workspace access and role clarity without implementing membership actions yet.",
  navigationLabel: "Members",
  placeholder: true,
  buildPath: (workspaceSlug) => `/workspaces/${workspaceSlug}/members`,
  renderScreen: renderMembersScreen,
};
