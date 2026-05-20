import type { ReactElement } from "react";

import { createElement } from "../lib/element.ts";

interface GlobalRoutePlaceholderProps {
  readonly title: string;
  readonly description: string;
  readonly routePath: string;
  readonly bodyTitle: string;
  readonly bodyDescription: string;
  readonly accentLabel: string;
}

export function GlobalRoutePlaceholder({
  title,
  description,
  routePath,
  bodyTitle,
  bodyDescription,
  accentLabel,
}: GlobalRoutePlaceholderProps): ReactElement {
  return createElement(
    "main",
    {
      className: "global-route-placeholder",
      "aria-labelledby": "page-title",
    },
    createElement(
      "section",
      { className: "global-route-placeholder__card" },
      createElement("p", { className: "global-route-placeholder__eyebrow" }, accentLabel),
      createElement("h1", { className: "global-route-placeholder__title", id: "page-title" }, title),
      createElement("p", { className: "global-route-placeholder__description" }, description),
      createElement("code", { className: "global-route-placeholder__route" }, routePath),
      createElement(
        "div",
        { className: "global-route-placeholder__body" },
        createElement("h2", { className: "global-route-placeholder__body-title" }, bodyTitle),
        createElement("p", { className: "global-route-placeholder__body-copy" }, bodyDescription),
      ),
    ),
  );
}
