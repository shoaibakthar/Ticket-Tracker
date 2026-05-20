import type { ReactElement } from "react";

import { createElement } from "../../lib/element";

export function ErrorStatePlaceholder(): ReactElement {
  return createElement(
    "section",
    { className: "state-card state-card--error", "aria-label": "Error state placeholder" },
    createElement("h3", { className: "state-card__title" }, "Error"),
    createElement(
      "p",
      { className: "state-card__body" },
      "Show a plain-language message with a safe retry path instead of raw backend details.",
    ),
  );
}
