import type { ReactElement } from "react";
import type { Permission } from "../../../../packages/auth/src/permissions";

import { GlobalRoutePlaceholder } from "../components/global-route-placeholder.ts";
import { createElement } from "../lib/element.ts";

export const notAuthorizedPath = "/not-authorized";

interface NotAuthorizedScreenOptions {
  readonly attemptedPath: string | null;
  readonly missingPermissions: readonly Permission[];
}

export function renderNotAuthorizedScreen({
  attemptedPath,
  missingPermissions,
}: NotAuthorizedScreenOptions): ReactElement {
  return createElement(GlobalRoutePlaceholder, {
    accentLabel: "Permission placeholder",
    title: "Not authorized",
    description: attemptedPath
      ? `Use this route when a signed-in user is known but lacks permission for ${attemptedPath}.`
      : "Use this route when a signed-in user is known but lacks permission for the requested workspace action.",
    routePath: attemptedPath ?? notAuthorizedPath,
    bodyTitle: "Permission-aware route fallback",
    bodyDescription: missingPermissions.length
      ? `Missing permission placeholder: ${missingPermissions.join(", ")}`
      : "Keep this separate from not found so later auth and permission checks can surface the correct state without leaking implementation details.",
  });
}
