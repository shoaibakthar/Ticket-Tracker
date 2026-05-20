import type { ReactElement } from "react";

import { createElement } from "../lib/element.ts";
import { buildSidebarNavigation, buildWorkspaceSwitcherItems } from "../navigation/sidebar.ts";
import type {
  PlaceholderRouteModule,
  SessionBootstrapData,
  TicketListData,
  WorkspaceOverviewData,
} from "../navigation/types.ts";
import { Sidebar } from "./sidebar.ts";
import { Topbar } from "./topbar.ts";

interface AppShellProps {
  readonly workspaceSlug: string;
  readonly route: PlaceholderRouteModule;
  readonly sessionBootstrap: SessionBootstrapData | null;
  readonly workspaceOverview: WorkspaceOverviewData | null;
  readonly ticketList: TicketListData | null;
  readonly ticketListError: string | null;
}

export function AppShell({
  workspaceSlug,
  route,
  sessionBootstrap,
  workspaceOverview,
  ticketList,
  ticketListError,
}: AppShellProps): ReactElement {
  const sidebarSections = buildSidebarNavigation(workspaceSlug, route.id, sessionBootstrap);
  const workspaceOptions = buildWorkspaceSwitcherItems(route.id, sessionBootstrap, workspaceSlug);

  return createElement(
    "div",
    { className: "app-shell" },
      createElement(Sidebar, {
        workspaceSlug,
        sections: sidebarSections,
        workspaceOptions,
      }),
    createElement(
      "div",
      { className: "app-shell__main" },
      createElement(Topbar, {
        title: route.title,
        subtitle: route.summary,
        workspaceSlug,
      }),
      createElement(
        "main",
        {
          className: "app-shell__content",
          "aria-labelledby": "page-title",
        },
          route.renderScreen({
            workspaceSlug,
            requiredPermissions: route.requiredPermissions,
            sessionBootstrap,
            workspaceOverview,
            ticketList,
            ticketListError,
          }),
        ),
      ),
  );
}
