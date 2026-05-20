import type { WorkspaceMembershipSummary } from "../../../../packages/auth/src/index";
import type { D1Database } from "./d1";

interface WorkspaceMembershipRow {
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly tenantId: string;
  readonly role: WorkspaceMembershipSummary["role"];
  readonly memberStatus: string;
}

interface WorkspaceOverviewRow {
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly workspaceName: string;
  readonly workspaceDescription: string | null;
  readonly workspaceIsDefault: number | boolean;
  readonly tenantId: string;
  readonly tenantName: string;
  readonly tenantSlug: string;
  readonly activeMemberCount: number | string;
}

interface WorkspaceTicketRow {
  readonly ticketId: string;
  readonly ticketNumber: string;
  readonly title: string;
  readonly status: string;
  readonly priority: string;
  readonly updatedAt: string;
  readonly assigneeMemberId: string | null;
  readonly assigneeUserId: string | null;
  readonly assigneeDisplayName: string | null;
  readonly assigneeEmail: string | null;
}

export interface WorkspaceOverviewRecord {
  readonly workspace: {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
    readonly description: string | null;
    readonly isDefault: boolean;
    readonly tenant: {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    };
  };
  readonly summary: {
    readonly activeMemberCount: number;
  };
}

export interface WorkspaceTicketListRecord {
  readonly items: readonly {
    readonly id: string;
    readonly ticketNumber: string;
    readonly title: string;
    readonly status: string;
    readonly priority: string;
    readonly updatedAt: string;
    readonly assignee: {
      readonly memberId: string;
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    } | null;
  }[];
}

export async function findWorkspaceMembershipForUser(
  database: D1Database,
  userId: string,
  workspaceSlug: string,
): Promise<WorkspaceMembershipSummary | null> {
  const row = await database
    .prepare(
      `
        SELECT
          workspaces.id AS workspaceId,
          workspaces.slug AS workspaceSlug,
          tenants.id AS tenantId,
          workspace_members.role AS role,
          workspace_members.member_status AS memberStatus
        FROM workspace_members
        INNER JOIN workspaces ON workspaces.id = workspace_members.workspace_id
        INNER JOIN tenants ON tenants.id = workspaces.tenant_id
        WHERE workspace_members.user_id = ?
          AND workspaces.slug = ?
          AND workspace_members.archived_at IS NULL
          AND workspaces.archived_at IS NULL
          AND tenants.archived_at IS NULL
        LIMIT 1
      `,
    )
    .bind(userId, workspaceSlug)
    .first<WorkspaceMembershipRow>();

  if (!row) {
    return null;
  }

  return {
    workspaceId: row.workspaceId,
    workspaceSlug: row.workspaceSlug,
    tenantId: row.tenantId,
    role: row.role,
    memberStatus: row.memberStatus,
  };
}

export async function findWorkspaceOverviewBySlug(
  database: D1Database,
  workspaceSlug: string,
): Promise<WorkspaceOverviewRecord | null> {
  const row = await database
    .prepare(
      `
        SELECT
          workspaces.id AS workspaceId,
          workspaces.slug AS workspaceSlug,
          workspaces.name AS workspaceName,
          workspaces.description AS workspaceDescription,
          workspaces.is_default AS workspaceIsDefault,
          tenants.id AS tenantId,
          tenants.name AS tenantName,
          tenants.slug AS tenantSlug,
          COUNT(
            CASE
              WHEN workspace_members.archived_at IS NULL
                AND workspace_members.member_status = 'active'
              THEN 1
            END
          ) AS activeMemberCount
        FROM workspaces
        INNER JOIN tenants ON tenants.id = workspaces.tenant_id
        LEFT JOIN workspace_members ON workspace_members.workspace_id = workspaces.id
        WHERE workspaces.slug = ?
          AND workspaces.archived_at IS NULL
          AND tenants.archived_at IS NULL
        GROUP BY
          workspaces.id,
          workspaces.slug,
          workspaces.name,
          workspaces.description,
          workspaces.is_default,
          tenants.id,
          tenants.name,
          tenants.slug
        LIMIT 1
      `,
    )
    .bind(workspaceSlug)
    .first<WorkspaceOverviewRow>();

  if (!row) {
    return null;
  }

  return {
    workspace: {
      id: row.workspaceId,
      slug: row.workspaceSlug,
      name: row.workspaceName,
      description: row.workspaceDescription,
      isDefault: row.workspaceIsDefault === true || row.workspaceIsDefault === 1,
      tenant: {
        id: row.tenantId,
        name: row.tenantName,
        slug: row.tenantSlug,
      },
    },
    summary: {
      activeMemberCount: Number(row.activeMemberCount),
    },
  };
}

export async function listWorkspaceTickets(
  database: D1Database,
  workspaceId: string,
): Promise<WorkspaceTicketListRecord> {
  const rows = await database
    .prepare(
      `
        SELECT
          tickets.id AS ticketId,
          tickets.ticket_number AS ticketNumber,
          tickets.title AS title,
          tickets.status AS status,
          tickets.priority AS priority,
          tickets.updated_at AS updatedAt,
          assignee_members.id AS assigneeMemberId,
          assignee_users.id AS assigneeUserId,
          assignee_users.full_name AS assigneeDisplayName,
          assignee_users.email AS assigneeEmail
        FROM tickets
        LEFT JOIN workspace_members AS assignee_members ON assignee_members.id = tickets.assignee_member_id
        LEFT JOIN users AS assignee_users ON assignee_users.id = assignee_members.user_id
        WHERE tickets.workspace_id = ?
          AND tickets.archived_at IS NULL
        ORDER BY tickets.updated_at DESC, tickets.ticket_number DESC
      `,
    )
    .bind(workspaceId)
    .all<WorkspaceTicketRow>();

  return {
    items: rows.results.map((row) => ({
      id: row.ticketId,
      ticketNumber: row.ticketNumber,
      title: row.title,
      status: row.status,
      priority: row.priority,
      updatedAt: row.updatedAt,
      assignee:
        row.assigneeMemberId && row.assigneeUserId && row.assigneeEmail
          ? {
              memberId: row.assigneeMemberId,
              userId: row.assigneeUserId,
              displayName: row.assigneeDisplayName,
              email: row.assigneeEmail,
            }
          : null,
    })),
  };
}
