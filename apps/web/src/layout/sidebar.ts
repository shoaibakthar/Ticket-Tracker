import type { ReactElement } from "react";

import { createElement } from "../lib/element.ts";
import type { SidebarNavigationSection, WorkspaceSwitcherItem } from "../navigation/types.ts";

interface SidebarProps {
  readonly workspaceSlug: string;
  readonly sections: readonly SidebarNavigationSection[];
  readonly workspaceOptions: readonly WorkspaceSwitcherItem[];
}

export function Sidebar({ workspaceSlug, sections, workspaceOptions }: SidebarProps): ReactElement {
  return createElement(
    "aside",
    {
      className: "sidebar",
      "aria-label": "Primary navigation",
    },
    createElement(
      "div",
      { className: "sidebar__workspace" },
      createElement("p", { className: "sidebar__label" }, "Current Workspace"),
      createElement("strong", { className: "sidebar__workspace-name" }, workspaceSlug),
      workspaceOptions.length > 0
        ? createElement(
            "div",
            { className: "sidebar__workspace-switcher" },
            createElement("p", { className: "sidebar__workspace-note" }, "Accessible workspaces"),
            createElement(
              "ul",
              { className: "sidebar__workspace-list" },
              ...workspaceOptions.map((workspace) =>
                createElement(
                  "li",
                  { className: "sidebar__workspace-item", key: workspace.workspaceSlug },
                  createElement(
                    "a",
                    {
                      className: workspace.current
                        ? "sidebar__workspace-link sidebar__workspace-link--current"
                        : "sidebar__workspace-link",
                      href: workspace.href,
                    },
                    workspace.workspaceName,
                  ),
                ),
              ),
            ),
          )
        : createElement("p", { className: "sidebar__workspace-note" }, "Workspace switcher loads from session data."),
    ),
    ...sections.map((section) =>
      createElement(
        "section",
        {
          className: "sidebar__section",
          key: section.id,
        },
        createElement("h2", { className: "sidebar__section-title" }, section.title),
        createElement(
          "ul",
          { className: "sidebar__list" },
          ...section.items.map((item) =>
            createElement(
              "li",
              { className: "sidebar__item", key: item.routeId },
              createElement(
                "a",
                {
                  "aria-current": item.current ? "page" : undefined,
                  className: item.current ? "sidebar__link sidebar__link--current" : "sidebar__link",
                  href: item.href,
                },
                item.label,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
