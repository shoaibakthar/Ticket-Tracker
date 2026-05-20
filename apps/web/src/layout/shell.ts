import type { ReactElement } from "react";

import { createElement } from "../lib/element.ts";
import { buildSidebarNavigation } from "../navigation/sidebar.ts";
import type { PlaceholderRouteModule } from "../navigation/types.ts";
import { Sidebar } from "./sidebar.ts";
import { Topbar } from "./topbar.ts";

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
