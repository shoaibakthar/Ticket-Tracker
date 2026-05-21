import type { MiddlewareHandler } from "hono";

import {
  authPlaceholderHeaderNames,
  createAuthenticatedSession,
  createInvalidSession,
  isKnownPlatformRole,
} from "../../../../packages/auth/src/index";
import type { ApiAppContext } from "../lib/context";
import {
  findLocalDevelopmentSessionLookupRecord,
  shouldUseLocalDevelopmentFallback,
} from "../lib/local-development";
import { findSessionLookupRecord, type SessionLookupRecord } from "../lib/session-store";
import { hashSessionToken, readSessionToken } from "../lib/session-token";

export const resolveRequestSessionContext: MiddlewareHandler<ApiAppContext> = async (
  context,
  next,
) => {
  const sessionToken = readSessionToken(context);

  if (!sessionToken) {
    context.set("requestSession", {
      state: "anonymous",
      driver: "hybrid-friendly-placeholder",
      source: "none",
    });
    await next();
    return;
  }

  let sessionLookupRecord: SessionLookupRecord | null;

  try {
    sessionLookupRecord = await findSessionLookupRecord(
      context.env.DB,
      await hashSessionToken(sessionToken.token),
      new Date().toISOString(),
    );
  } catch (error) {
    if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
      throw error;
    }

    sessionLookupRecord = findLocalDevelopmentSessionLookupRecord(sessionToken.token);
  }

  if (!sessionLookupRecord) {
    context.set("requestSession", createInvalidSession("session_token_not_found", sessionToken.source));
    await next();
    return;
  }

  const platformRoleHeader = context.req.header(authPlaceholderHeaderNames.platformRole) ?? null;

  if (
    sessionLookupRecord.userType === "internal" &&
    platformRoleHeader &&
    !isKnownPlatformRole(platformRoleHeader)
  ) {
    context.set("requestSession", createInvalidSession("invalid_platform_role", sessionToken.source));
    await next();
    return;
  }

  const session = createAuthenticatedSession({
    source: sessionToken.source,
    sessionId: sessionLookupRecord.sessionId,
    userId: sessionLookupRecord.userId,
    userEmail: sessionLookupRecord.userEmail,
    userDisplayName: sessionLookupRecord.userDisplayName,
    userType: sessionLookupRecord.userType,
    platformRole:
      sessionLookupRecord.userType === "internal" && platformRoleHeader && isKnownPlatformRole(platformRoleHeader)
        ? platformRoleHeader
        : null,
  });

  context.set("requestSession", session);
  await next();
};
