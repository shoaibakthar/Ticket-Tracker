import type { MiddlewareHandler } from "hono";

import {
  resolveWorkspaceAccess,
} from "../../../../packages/auth/src/index";
import { getRequestSession, type ApiAppContext } from "../lib/context";
import { findWorkspaceMembershipForUser } from "../lib/workspace-store";

export const resolveWorkspaceAccessContext: MiddlewareHandler<ApiAppContext> = async (
  context,
  next,
) => {
  const workspaceSlug = context.req.param("workspaceSlug") ?? "";
  const requestSession = getRequestSession(context);
  const membership =
    requestSession.state === "authenticated" && requestSession.user.userType === "customer"
      ? await findWorkspaceMembershipForUser(context.env.DB, requestSession.user.id, workspaceSlug)
      : null;

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
