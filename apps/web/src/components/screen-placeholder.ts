import type { ReactElement } from "react";
import type { Permission } from "../../../../packages/auth/src/permissions";

import { createElement } from "../lib/element.ts";
import { EmptyStatePlaceholder } from "./states/empty-state.ts";
import { ErrorStatePlaceholder } from "./states/error-state.ts";
import { LoadingStatePlaceholder } from "./states/loading-state.ts";

interface ScreenPlaceholderProps {
  readonly workspaceSlug: string;
  readonly routePath: string;
  readonly title: string;
  readonly description: string;
  readonly primaryActionLabel?: string;
  readonly bodyTitle: string;
  readonly bodyDescription: string;
  readonly requiredPermissions: readonly Permission[];
  readonly routeState?: unknown;
  readonly sessionBootstrap: unknown;
  readonly workspaceOverview: unknown;
  readonly ticketList?: unknown;
  readonly ticketListError?: unknown;
  readonly ticketDetail?: unknown;
  readonly ticketDetailError?: unknown;
}

export function ScreenPlaceholder({
  workspaceSlug,
  routePath,
  title,
  description,
  primaryActionLabel,
  bodyTitle,
  bodyDescription,
  requiredPermissions,
  routeState: _routeState,
  sessionBootstrap: _sessionBootstrap,
  workspaceOverview: _workspaceOverview,
  ticketList: _ticketList,
  ticketListError: _ticketListError,
  ticketDetail: _ticketDetail,
  ticketDetailError: _ticketDetailError,
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
      createElement(
        "p",
        { className: "screen-placeholder__access-note" },
        `Required permission placeholder: ${requiredPermissions.join(", ")}`,
      ),
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
