import { isKnownPermission } from "../../../../packages/auth/src/permissions";
import { isKnownRole, isKnownWorkspaceRole } from "../../../../packages/auth/src/roles";
import type {
  RouteAuthorizationSnapshot,
  SessionBootstrapData,
  SessionBootstrapWorkspace,
} from "../navigation/types.ts";

export function readSessionBootstrapResponse(value: unknown): SessionBootstrapData {
  const record = expectRecord(value);
  const data = expectRecord(record.data);
  const workspaces = expectArray(data.workspaces).map(readSessionBootstrapWorkspace);
  const user = data.user === null ? null : readSessionBootstrapUser(data.user);
  const session = expectRecord(data.session);

  return {
    authenticated: expectBoolean(data.authenticated),
    user,
    session: {
      state: expectSessionState(session.state),
      driver: expectString(session.driver),
      providerModel: expectString(session.providerModel),
      source: expectString(session.source),
    },
    workspaces,
  };
}

export function createWorkspaceAuthorizationSnapshot(
  sessionBootstrap: SessionBootstrapData,
  workspaceSlug: string,
): RouteAuthorizationSnapshot {
  if (!sessionBootstrap.authenticated) {
    return {
      sessionState: "anonymous",
      grantedPermissions: [],
    };
  }

  return {
    sessionState: "authenticated",
    grantedPermissions:
      sessionBootstrap.workspaces.find((workspace) => workspace.workspaceSlug === workspaceSlug)
        ?.grantedPermissions ?? [],
  };
}

function readSessionBootstrapUser(value: unknown): SessionBootstrapData["user"] {
  const record = expectRecord(value);
  const userType = expectString(record.userType);

  if (userType !== "internal" && userType !== "customer") {
    throw new Error("Invalid session bootstrap userType.");
  }

  return {
    id: expectString(record.id),
    email: expectString(record.email),
    displayName: readNullableString(record.displayName),
    userType,
  };
}

function readSessionBootstrapWorkspace(value: unknown): SessionBootstrapWorkspace {
  const record = expectRecord(value);
  const actorRole = expectString(record.actorRole);
  const membershipRole = record.membershipRole === null ? null : expectString(record.membershipRole);
  const grantedPermissions = expectArray(record.grantedPermissions).map(expectString);

  if (!isKnownRole(actorRole)) {
    throw new Error("Invalid actor role in session bootstrap response.");
  }

  if (membershipRole !== null && !isKnownWorkspaceRole(membershipRole)) {
    throw new Error("Invalid workspace membership role in session bootstrap response.");
  }

  if (!grantedPermissions.every((permission) => isKnownPermission(permission))) {
    throw new Error("Invalid granted permission in session bootstrap response.");
  }

  return {
    workspaceId: expectString(record.workspaceId),
    workspaceSlug: expectString(record.workspaceSlug),
    workspaceName: expectString(record.workspaceName),
    tenantId: expectString(record.tenantId),
    tenantSlug: expectString(record.tenantSlug),
    tenantName: expectString(record.tenantName),
    actorRole,
    membershipRole,
    memberStatus: readNullableString(record.memberStatus),
    accessPath: expectAccessPath(record.accessPath),
    grantedPermissions,
  };
}

function expectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected record object.");
  }

  return value as Record<string, unknown>;
}

function expectArray(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected array.");
  }

  return value;
}

function expectString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Expected string value.");
  }

  return value;
}

function expectBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new Error("Expected boolean value.");
  }

  return value;
}

function readNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return expectString(value);
}

function expectSessionState(value: unknown): SessionBootstrapData["session"]["state"] {
  const state = expectString(value);

  if (state !== "anonymous" && state !== "invalid" && state !== "authenticated") {
    throw new Error("Invalid session bootstrap state.");
  }

  return state;
}

function expectAccessPath(value: unknown): SessionBootstrapWorkspace["accessPath"] {
  const accessPath = expectString(value);

  if (accessPath !== "workspace-membership" && accessPath !== "cross-workspace-support") {
    throw new Error("Invalid workspace access path.");
  }

  return accessPath;
}
