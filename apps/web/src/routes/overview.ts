import type { ReactElement } from "react";

import { createElement } from "../lib/element.ts";
import { ScreenPlaceholder } from "../components/screen-placeholder.ts";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types.ts";

function renderOverviewScreen({
  workspaceSlug,
  sessionBootstrap,
  workspaceOverview,
}: PlaceholderScreenProps): ReactElement {
  if (workspaceOverview) {
    return createElement(
      "section",
      { className: "workspace-overview" },
      createElement(
        "div",
        { className: "workspace-overview__header" },
        createElement("p", { className: "screen-placeholder__eyebrow" }, `Workspace slug: ${workspaceSlug}`),
        createElement("h2", { className: "workspace-overview__title" }, workspaceOverview.workspace.name),
        createElement(
          "p",
          { className: "workspace-overview__description" },
          workspaceOverview.workspace.description ??
            "This workspace does not have a description yet.",
        ),
      ),
      createElement(
        "div",
        { className: "workspace-overview__grid" },
        createElement(
          "section",
          { className: "workspace-overview__card" },
          createElement("h3", { className: "workspace-overview__card-title" }, "Tenant"),
          createElement(
            "p",
            { className: "workspace-overview__card-body" },
            `${workspaceOverview.workspace.tenant.name} (${workspaceOverview.workspace.tenant.slug})`,
          ),
        ),
        createElement(
          "section",
          { className: "workspace-overview__card" },
          createElement("h3", { className: "workspace-overview__card-title" }, "Access"),
          createElement(
            "p",
            { className: "workspace-overview__card-body" },
            `Actor role: ${workspaceOverview.access.actorRole}`,
          ),
          createElement(
            "p",
            { className: "workspace-overview__card-body" },
            `Access path: ${workspaceOverview.access.accessPath}`,
          ),
          workspaceOverview.membership
            ? createElement(
                "p",
                { className: "workspace-overview__card-body" },
                `Membership: ${workspaceOverview.membership.role} (${workspaceOverview.membership.memberStatus})`,
              )
            : null,
        ),
        createElement(
          "section",
          { className: "workspace-overview__card" },
          createElement("h3", { className: "workspace-overview__card-title" }, "Summary"),
          createElement(
            "p",
            { className: "workspace-overview__card-body" },
            `Active members: ${workspaceOverview.summary.activeMemberCount}`,
          ),
          createElement(
            "p",
            { className: "workspace-overview__card-body" },
            `Can view members: ${workspaceOverview.access.canViewMembers ? "yes" : "no"}`,
          ),
          createElement(
            "p",
            { className: "workspace-overview__card-body" },
            `Can view settings: ${workspaceOverview.access.canViewSettings ? "yes" : "no"}`,
          ),
        ),
      ),
      sessionBootstrap?.user
        ? createElement(
            "p",
            { className: "workspace-overview__footer" },
            `Signed in as ${sessionBootstrap.user.displayName ?? sessionBootstrap.user.email}`,
          )
        : null,
    );
  }

  return ScreenPlaceholder({
    workspaceSlug,
    sessionBootstrap,
    workspaceOverview,
    requiredPermissions: overviewRoute.requiredPermissions,
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
  requiredPermissions: ["workspace.view"],
  buildPath: (workspaceSlug) => `/workspaces/${workspaceSlug}/overview`,
  renderScreen: renderOverviewScreen,
};
