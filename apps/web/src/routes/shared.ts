import type { ReactElement } from "react";

import { GlobalRoutePlaceholder } from "../components/global-route-placeholder.ts";
import { createElement } from "../lib/element.ts";

export function buildSharedPath(token: string): string {
  return `/shared/${token}`;
}

export function renderSharedRouteShell(token: string): ReactElement {
  return createElement(GlobalRoutePlaceholder, {
    accentLabel: "Shared route shell",
    title: "Shared ticket view placeholder",
    description:
      "This route stays outside the main workspace shell so later external access flows can use a clearly distinct presentation.",
    routePath: buildSharedPath(token),
    bodyTitle: "External-access surface only",
    bodyDescription:
      "Keep shared access lightweight here until token validation, share-link permissions, and customer-safe content rules are implemented.",
  });
}
