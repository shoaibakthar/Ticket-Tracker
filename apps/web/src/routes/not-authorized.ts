import type { ReactElement } from "react";

import { GlobalRoutePlaceholder } from "../components/global-route-placeholder.ts";
import { createElement } from "../lib/element.ts";

export const notAuthorizedPath = "/not-authorized";

export function renderNotAuthorizedScreen(): ReactElement {
  return createElement(GlobalRoutePlaceholder, {
    accentLabel: "Permission placeholder",
    title: "Not authorized",
    description: "Use this route when a signed-in user is known but lacks permission for the requested workspace action.",
    routePath: notAuthorizedPath,
    bodyTitle: "Authorization-aware routing comes next",
    bodyDescription:
      "Keep this separate from not found so later auth and permission checks can surface the correct state without leaking implementation details.",
  });
}
