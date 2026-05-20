import {
  getGrantedPermissionsForRole,
  hasPermission,
  type AuthenticatedSession,
  type Permission,
  type Role,
  type WorkspaceRole,
} from "../../../../packages/auth/src/index";
import type { D1Database } from "./d1";

interface SessionLookupRow {
  readonly sessionId: string;
  readonly userId: string;
  readonly email: string;
  readonly fullName: string | null;
  readonly userType: "internal" | "customer";
}

interface CustomerWorkspaceRow {
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly workspaceName: string;
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly tenantName: string;
  readonly membershipRole: WorkspaceRole;
  readonly memberStatus: string;
}

interface SupportWorkspaceRow {
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly workspaceName: string;
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly tenantName: string;
}

export interface SessionBootstrapWorkspaceSummary {
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly workspaceName: string;
  readonly tenantId: string;
  readonly tenantSlug: string;
  readonly tenantName: string;
  readonly actorRole: Role;
  readonly membershipRole: WorkspaceRole | null;
  readonly memberStatus: string | null;
  readonly accessPath: "workspace-membership" | "cross-workspace-support";
  readonly grantedPermissions: readonly Permission[];
}

export interface SessionLookupRecord {
  readonly sessionId: string;
  readonly userId: string;
  readonly userEmail: string;
  readonly userDisplayName: string | null;
  readonly userType: "internal" | "customer";
}

export async function findSessionLookupRecord(
  database: D1Database,
  sessionTokenHash: string,
  nowIso: string,
): Promise<SessionLookupRecord | null> {
  const row = await database
    .prepare(
      `
        SELECT
          sessions.id AS sessionId,
          users.id AS userId,
          users.email AS email,
          users.full_name AS fullName,
          users.user_type AS userType
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.session_token_hash = ?
          AND sessions.revoked_at IS NULL
          AND sessions.expires_at > ?
          AND users.status = 'active'
          AND users.archived_at IS NULL
        LIMIT 1
      `,
    )
    .bind(sessionTokenHash, nowIso)
    .first<SessionLookupRow>();

  if (!row) {
    return null;
  }

  return {
    sessionId: row.sessionId,
    userId: row.userId,
    userEmail: row.email,
    userDisplayName: row.fullName,
    userType: row.userType,
  };
}

export async function listSessionBootstrapWorkspaces(
  database: D1Database,
  session: AuthenticatedSession,
): Promise<readonly SessionBootstrapWorkspaceSummary[]> {
  if (session.user.userType === "internal") {
    const platformRole = session.user.platformRole;

    if (!platformRole || !hasPermission(platformRole, "support.cross_workspace_access")) {
      return [];
    }

    const rows = await database
      .prepare(
        `
          SELECT
            workspaces.id AS workspaceId,
            workspaces.slug AS workspaceSlug,
            workspaces.name AS workspaceName,
            tenants.id AS tenantId,
            tenants.slug AS tenantSlug,
            tenants.name AS tenantName
          FROM workspaces
          INNER JOIN tenants ON tenants.id = workspaces.tenant_id
          WHERE workspaces.archived_at IS NULL
            AND tenants.archived_at IS NULL
          ORDER BY tenants.name ASC, workspaces.name ASC
        `,
      )
      .all<SupportWorkspaceRow>();

    return rows.results.map((row) => ({
      workspaceId: row.workspaceId,
      workspaceSlug: row.workspaceSlug,
      workspaceName: row.workspaceName,
      tenantId: row.tenantId,
      tenantSlug: row.tenantSlug,
      tenantName: row.tenantName,
      actorRole: platformRole,
      membershipRole: null,
      memberStatus: null,
      accessPath: "cross-workspace-support",
      grantedPermissions: getGrantedPermissionsForRole(platformRole),
    }));
  }

  const rows = await database
    .prepare(
      `
        SELECT
          workspaces.id AS workspaceId,
          workspaces.slug AS workspaceSlug,
          workspaces.name AS workspaceName,
          tenants.id AS tenantId,
          tenants.slug AS tenantSlug,
          tenants.name AS tenantName,
          workspace_members.role AS membershipRole,
          workspace_members.member_status AS memberStatus
        FROM workspace_members
        INNER JOIN workspaces ON workspaces.id = workspace_members.workspace_id
        INNER JOIN tenants ON tenants.id = workspaces.tenant_id
        WHERE workspace_members.user_id = ?
          AND workspace_members.archived_at IS NULL
          AND workspaces.archived_at IS NULL
          AND tenants.archived_at IS NULL
        ORDER BY tenants.name ASC, workspaces.name ASC
      `,
    )
    .bind(session.user.id)
    .all<CustomerWorkspaceRow>();

  return rows.results.map((row) => ({
    workspaceId: row.workspaceId,
    workspaceSlug: row.workspaceSlug,
    workspaceName: row.workspaceName,
    tenantId: row.tenantId,
    tenantSlug: row.tenantSlug,
    tenantName: row.tenantName,
    actorRole: row.membershipRole,
    membershipRole: row.membershipRole,
    memberStatus: row.memberStatus,
    accessPath: "workspace-membership",
    grantedPermissions: getGrantedPermissionsForRole(row.membershipRole),
  }));
}
