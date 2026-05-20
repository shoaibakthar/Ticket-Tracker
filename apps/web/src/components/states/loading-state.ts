import type { ReactElement } from "react";

import { createElement } from "../../lib/element";

export function LoadingStatePlaceholder(): ReactElement {
  return createElement(
    "section",
    { className: "state-card state-card--loading", "aria-label": "Loading state placeholder" },
    createElement("h3", { className: "state-card__title" }, "Loading"),
    createElement(
      "p",
      { className: "state-card__body" },
      "Use lightweight skeletons or stable loading placeholders to keep layout predictable.",
    ),
  );
}
