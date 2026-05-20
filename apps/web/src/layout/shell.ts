import type { ReactElement } from "react";

import { createElement } from "../lib/element";
import { buildSidebarNavigation } from "../navigation/sidebar";
import type { PlaceholderRouteModule } from "../navigation/types";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  readonly workspaceSlug: string;
  readonly route: PlaceholderRouteModule;
}

export function AppShell({ workspaceSlug, route }: AppShellProps): ReactElement {
  const sidebarSections = buildSidebarNavigation(workspaceSlug, route.id);

  return createElement(
    "div",
    { className: "app-shell" },
    createElement(Sidebar, {
      workspaceSlug,
      sections: sidebarSections,
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
        route.renderScreen({ workspaceSlug }),
      ),
    ),
  );
}
