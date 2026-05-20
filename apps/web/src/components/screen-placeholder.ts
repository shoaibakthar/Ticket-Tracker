import type { ReactElement } from "react";

import { createElement } from "../lib/element";
import { EmptyStatePlaceholder } from "./states/empty-state";
import { ErrorStatePlaceholder } from "./states/error-state";
import { LoadingStatePlaceholder } from "./states/loading-state";

interface ScreenPlaceholderProps {
  readonly workspaceSlug: string;
  readonly routePath: string;
  readonly title: string;
  readonly description: string;
  readonly primaryActionLabel?: string;
  readonly bodyTitle: string;
  readonly bodyDescription: string;
}

export function ScreenPlaceholder({
  workspaceSlug,
  routePath,
  title,
  description,
  primaryActionLabel,
  bodyTitle,
  bodyDescription,
}: ScreenPlaceholderProps): ReactElement {
  const emptyStateProps = primaryActionLabel
    ? {
        title: "Empty",
        body: "Explain why nothing is shown yet and point to the safest next action.",
        actionLabel: primaryActionLabel,
      }
    : {
        title: "Empty",
        body: "Explain why nothing is shown yet and point to the safest next action.",
      };

  return createElement(
    "section",
    { className: "screen-placeholder" },
    createElement(
      "div",
      { className: "screen-placeholder__header" },
      createElement("p", { className: "screen-placeholder__eyebrow" }, `Workspace slug: ${workspaceSlug}`),
      createElement("h2", { className: "screen-placeholder__title" }, title),
      createElement("p", { className: "screen-placeholder__description" }, description),
      createElement("code", { className: "screen-placeholder__route" }, routePath),
    ),
    createElement(
      "div",
      { className: "screen-placeholder__hero" },
      createElement(
        "div",
        { className: "screen-placeholder__card" },
        createElement("h3", { className: "screen-placeholder__card-title" }, bodyTitle),
        createElement("p", { className: "screen-placeholder__card-body" }, bodyDescription),
        primaryActionLabel
          ? createElement(
              "button",
              {
                className: "screen-placeholder__button",
                type: "button",
              },
              `${primaryActionLabel} (placeholder)`,
            )
          : null,
      ),
    ),
    createElement(
      "div",
      { className: "screen-placeholder__states" },
      createElement(LoadingStatePlaceholder, {}),
      createElement(EmptyStatePlaceholder, emptyStateProps),
      createElement(ErrorStatePlaceholder, {}),
    ),
  );
}
