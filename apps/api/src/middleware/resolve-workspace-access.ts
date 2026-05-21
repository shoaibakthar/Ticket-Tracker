import type { MiddlewareHandler } from "hono";

import {
  resolveWorkspaceAccess,
} from "../../../../packages/auth/src/index";
import { getRequestSession, type ApiAppContext } from "../lib/context";
import {
  findLocalDevelopmentWorkspaceMembershipForUser,
  shouldUseLocalDevelopmentFallback,
} from "../lib/local-development";
import { findWorkspaceMembershipForUser } from "../lib/workspace-store";

export const resolveWorkspaceAccessContext: MiddlewareHandler<ApiAppContext> = async (
  context,
  next,
) => {
  const workspaceSlug = context.req.param("workspaceSlug") ?? "";
  const requestSession = getRequestSession(context);
  let membership = null;

  if (requestSession.state === "authenticated" && requestSession.user.userType === "customer") {
    try {
      membership = await findWorkspaceMembershipForUser(context.env.DB, requestSession.user.id, workspaceSlug);
    } catch (error) {
      if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
        throw error;
      }

      membership = findLocalDevelopmentWorkspaceMembershipForUser(requestSession.user.id, workspaceSlug);
    }
  }

  context.set(
    "workspaceAccess",
    resolveWorkspaceAccess({
      session: requestSession,
      workspaceSlug,
      memberships: membership ? [membership] : [],
    }),
  );

  await next();
};
