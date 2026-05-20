import type { ReactElement } from "react";

import { GlobalRoutePlaceholder } from "../components/global-route-placeholder.ts";
import { createElement } from "../lib/element.ts";

export function renderNotFoundScreen(pathname: string): ReactElement {
  return createElement(GlobalRoutePlaceholder, {
    accentLabel: "Fallback placeholder",
    title: "Page not found",
    description: "Use this route when no documented app or shared path matches the current URL.",
    routePath: pathname,
    bodyTitle: "Unknown route",
    bodyDescription:
      "Later routing work can add redirects or richer recovery actions, but this foundation keeps unmatched paths explicit and separate from authorization failures.",
  });
}
