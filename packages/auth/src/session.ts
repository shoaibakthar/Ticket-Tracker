import type { PlatformRole } from "./roles";
import { isKnownPlatformRole } from "./roles";

export const sessionDriverValues = ["hybrid-friendly-placeholder"] as const;
export const sessionUserTypeValues = ["internal", "customer"] as const;
export const sessionResolutionSources = ["cookie", "authorization-header", "placeholder-headers"] as const;

export type SessionDriver = (typeof sessionDriverValues)[number];
export type SessionUserType = (typeof sessionUserTypeValues)[number];
export type SessionResolutionSource = (typeof sessionResolutionSources)[number];

export const authPlaceholderHeaderNames = {
  sessionId: "x-observeid-session-id",
  userId: "x-observeid-user-id",
  userEmail: "x-observeid-user-email",
  userDisplayName: "x-observeid-user-display-name",
  userType: "x-observeid-user-type",
  platformRole: "x-observeid-platform-role",
  workspaceId: "x-observeid-workspace-id",
  workspaceSlug: "x-observeid-workspace-slug",
  tenantId: "x-observeid-tenant-id",
  workspaceRole: "x-observeid-workspace-role",
  memberStatus: "x-observeid-member-status",
} as const;

export const sessionStrategyPlaceholder = {
  driver: "hybrid-friendly-placeholder",
  providerModel: "provider-agnostic",
  persistence: "hybrid-friendly",
  sessionTable: "sessions",
  cookieName: "oid_session",
  authorizationScheme: "Bearer",
  placeholderSource: "headers",
} as const satisfies {
  readonly driver: SessionDriver;
  readonly providerModel: "provider-agnostic";
  readonly persistence: "hybrid-friendly";
  readonly sessionTable: "sessions";
  readonly cookieName: string;
  readonly authorizationScheme: "Bearer";
  readonly placeholderSource: "headers";
};

export interface SessionUserSummary {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly userType: SessionUserType;
  readonly platformRole: PlatformRole | null;
}

export interface AnonymousSession {
  readonly state: "anonymous";
  readonly driver: SessionDriver;
  readonly source: "none";
}

export interface InvalidSession {
  readonly state: "invalid";
  readonly driver: SessionDriver;
  readonly source: SessionResolutionSource;
  readonly reason:
    | "missing_identity_headers"
    | "invalid_user_type"
    | "internal_role_required"
    | "invalid_platform_role"
    | "session_token_not_found";
}

export interface AuthenticatedSession {
  readonly state: "authenticated";
  readonly driver: SessionDriver;
  readonly source: SessionResolutionSource;
  readonly sessionId: string;
  readonly user: SessionUserSummary;
}

export type RequestSession = AnonymousSession | InvalidSession | AuthenticatedSession;

export interface SessionResolutionInput {
  readonly sessionId: string | null;
  readonly userId: string | null;
  readonly userEmail: string | null;
  readonly userDisplayName: string | null;
  readonly userType: string | null;
  readonly platformRole: string | null;
  readonly source?: SessionResolutionSource;
}

export interface AuthenticatedSessionInput {
  readonly source: SessionResolutionSource;
  readonly sessionId: string;
  readonly userId: string;
  readonly userEmail: string;
  readonly userDisplayName: string | null;
  readonly userType: SessionUserType;
  readonly platformRole: PlatformRole | null;
}

export function createAnonymousSession(): AnonymousSession {
  return {
    state: "anonymous",
    driver: sessionStrategyPlaceholder.driver,
    source: "none",
  };
}

export function createInvalidSession(
  reason: InvalidSession["reason"],
  source: SessionResolutionSource,
): InvalidSession {
  return {
    state: "invalid",
    driver: sessionStrategyPlaceholder.driver,
    source,
    reason,
  };
}

export function createAuthenticatedSession({
  source,
  sessionId,
  userId,
  userEmail,
  userDisplayName,
  userType,
  platformRole,
}: AuthenticatedSessionInput): AuthenticatedSession {
  return {
    state: "authenticated",
    driver: sessionStrategyPlaceholder.driver,
    source,
    sessionId,
    user: {
      id: userId,
      email: userEmail,
      displayName: normalizeOptionalValue(userDisplayName),
      userType,
      platformRole,
    },
  };
}

export function isKnownSessionUserType(value: string): value is SessionUserType {
  return sessionUserTypeValues.includes(value as SessionUserType);
}

export function isAuthenticatedSession(session: RequestSession): session is AuthenticatedSession {
  return session.state === "authenticated";
}

export function resolveRequestSession(input: SessionResolutionInput): RequestSession {
  const source = input.source ?? "placeholder-headers";

  if (!hasAnyIdentityHeaders(input)) {
    return createAnonymousSession();
  }

  if (!input.userId || !input.userEmail || !input.userType) {
    return createInvalidSession("missing_identity_headers", source);
  }

  if (!isKnownSessionUserType(input.userType)) {
    return createInvalidSession("invalid_user_type", source);
  }

  if (input.userType === "internal" && !input.platformRole) {
    return createInvalidSession("internal_role_required", source);
  }

  if (input.platformRole && !isKnownPlatformRole(input.platformRole)) {
    return createInvalidSession("invalid_platform_role", source);
  }

  const platformRole = input.platformRole && isKnownPlatformRole(input.platformRole)
    ? input.platformRole
    : null;

  return createAuthenticatedSession({
    source,
    sessionId: input.sessionId ?? `placeholder-session:${input.userId}`,
    userId: input.userId,
    userEmail: input.userEmail,
    userDisplayName: input.userDisplayName,
    userType: input.userType,
    platformRole,
  });
}

function hasAnyIdentityHeaders(input: SessionResolutionInput): boolean {
  return [
    input.sessionId,
    input.userId,
    input.userEmail,
    input.userDisplayName,
    input.userType,
    input.platformRole,
  ].some((value) => normalizeOptionalValue(value) !== null);
}

function normalizeOptionalValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
