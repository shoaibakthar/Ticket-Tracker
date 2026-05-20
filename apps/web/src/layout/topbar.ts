import type { ReactElement } from "react";

import { createElement } from "../lib/element";

interface TopbarProps {
  readonly title: string;
  readonly subtitle: string;
  readonly workspaceSlug: string;
}

export function Topbar({ title, subtitle, workspaceSlug }: TopbarProps): ReactElement {
  return createElement(
    "header",
    { className: "topbar" },
    createElement(
      "div",
      { className: "topbar__titles" },
      createElement("p", { className: "topbar__eyebrow" }, `Workspace / ${workspaceSlug}`),
      createElement("h1", { className: "topbar__title", id: "page-title" }, title),
      createElement("p", { className: "topbar__subtitle" }, subtitle),
    ),
    createElement(
      "div",
      { className: "topbar__actions", "aria-label": "Contextual actions" },
      createElement("span", { className: "topbar__action-pill" }, "Breadcrumbs later"),
      createElement("span", { className: "topbar__action-pill" }, "Search later"),
      createElement("span", { className: "topbar__action-pill" }, "Account menu later"),
    ),
  );
}
