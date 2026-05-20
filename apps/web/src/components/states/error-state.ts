import type { ReactElement } from "react";

import { createElement } from "../../lib/element.ts";

interface ErrorStatePlaceholderProps {
  readonly title?: string;
  readonly body?: string;
}

export function ErrorStatePlaceholder({
  title = "Error",
  body = "Show a plain-language message with a safe retry path instead of raw backend details.",
}: ErrorStatePlaceholderProps = {}): ReactElement {
  return createElement(
    "section",
    { className: "state-card state-card--error", "aria-label": "Error state placeholder" },
    createElement("h3", { className: "state-card__title" }, title),
    createElement("p", { className: "state-card__body" }, body),
  );
}
