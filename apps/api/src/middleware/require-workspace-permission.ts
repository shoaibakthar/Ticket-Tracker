import type { MiddlewareHandler } from "hono";

import {
  authorizeWorkspacePermission,
  type Permission,
} from "../../../../packages/auth/src/index";
import { respondWithError } from "../lib/api-response";
import { getWorkspaceAccess, type ApiAppContext } from "../lib/context";

export function requireWorkspacePermission(
  requiredPermission: Permission,
): MiddlewareHandler<ApiAppContext> {
  return async (context, next) => {
    const workspaceAccess = getWorkspaceAccess(context);

    if (!workspaceAccess) {
      return respondWithError(
        context,
        500,
        "internal_error",
        "Workspace access foundation was not resolved before permission enforcement.",
      );
    }

    const decision = authorizeWorkspacePermission({
      workspaceAccess,
      requiredPermission,
    });

    if (!decision.allowed) {
      return respondWithError(
        context,
        decision.errorCode === "unauthorized" ? 401 : 403,
        decision.errorCode,
        decision.errorCode === "unauthorized"
          ? "A valid session is required for this route."
          : "The current session cannot access this workspace route.",
      );
    }

    await next();
  };
}
