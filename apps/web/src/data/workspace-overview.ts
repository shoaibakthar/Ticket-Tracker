import { isKnownRole, isKnownWorkspaceRole, type WorkspaceRole } from "../../../../packages/auth/src/roles";
import type { WorkspaceOverviewData } from "../navigation/types.ts";

export function readWorkspaceOverviewResponse(value: unknown): WorkspaceOverviewData {
  const record = expectRecord(value);
  const data = expectRecord(record.data);
  const workspace = expectRecord(data.workspace);
  const tenant = expectRecord(workspace.tenant);
  const access = expectRecord(data.access);
  const membership = data.membership === null ? null : expectRecord(data.membership);
  const actorRole = expectString(access.actorRole);

  if (!isKnownRole(actorRole)) {
    throw new Error("Invalid overview actor role.");
  }

  const membershipRole = membership === null ? null : expectString(membership.role);

  if (membershipRole !== null && !isKnownWorkspaceRole(membershipRole)) {
    throw new Error("Invalid overview membership role.");
  }

  const normalizedMembership =
    membership === null
      ? null
      : {
          role: expectWorkspaceRole(membershipRole),
          memberStatus: expectString(membership.memberStatus),
        };

  return {
    workspace: {
      id: expectString(workspace.id),
      slug: expectString(workspace.slug),
      name: expectString(workspace.name),
      description: readNullableString(workspace.description),
      isDefault: expectBoolean(workspace.isDefault),
      tenant: {
        id: expectString(tenant.id),
        name: expectString(tenant.name),
        slug: expectString(tenant.slug),
      },
    },
    summary: {
      activeMemberCount: expectNumber(expectRecord(data.summary).activeMemberCount),
    },
    membership: normalizedMembership,
    access: {
      actorRole,
      accessPath: expectAccessPath(access.accessPath),
      canViewMembers: expectBoolean(access.canViewMembers),
      canViewSettings: expectBoolean(access.canViewSettings),
    },
  };
}

function expectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected record object.");
  }

  return value as Record<string, unknown>;
}

function expectString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Expected string.");
  }

  return value;
}

function expectBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new Error("Expected boolean.");
  }

  return value;
}

function expectNumber(value: unknown): number {
  if (typeof value !== "number") {
    throw new Error("Expected number.");
  }

  return value;
}

function readNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return expectString(value);
}

function expectAccessPath(value: unknown): WorkspaceOverviewData["access"]["accessPath"] {
  const accessPath = expectString(value);

  if (accessPath !== "workspace-membership" && accessPath !== "cross-workspace-support") {
    throw new Error("Invalid access path.");
  }

  return accessPath;
}

function expectWorkspaceRole(value: string | null): WorkspaceRole {
  if (!value || !isKnownWorkspaceRole(value)) {
    throw new Error("Expected workspace role.");
  }

  return value;
}
