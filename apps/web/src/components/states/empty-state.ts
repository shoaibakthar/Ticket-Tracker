import type { ReactElement } from "react";

import { createElement } from "../../lib/element";

interface EmptyStatePlaceholderProps {
  readonly title: string;
  readonly body: string;
  readonly actionLabel?: string;
}

export function EmptyStatePlaceholder({
  title,
  body,
  actionLabel,
}: EmptyStatePlaceholderProps): ReactElement {
  return createElement(
    "section",
    { className: "state-card state-card--empty", "aria-label": "Empty state placeholder" },
    createElement("h3", { className: "state-card__title" }, title),
    createElement("p", { className: "state-card__body" }, body),
    actionLabel
      ? createElement("p", { className: "state-card__action" }, `${actionLabel} (placeholder)`)
      : null,
  );
}
