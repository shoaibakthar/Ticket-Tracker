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
  readonly visibility: string;
  readonly updatedAt: string;
  readonly assigneeMemberId: string | null;
  readonly assigneeUserId: string | null;
  readonly assigneeDisplayName: string | null;
  readonly assigneeEmail: string | null;
}

interface WorkspaceTicketDetailRow {
  readonly ticketId: string;
  readonly ticketNumber: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: string;
  readonly priority: string;
  readonly visibility: string;
  readonly dueDate: string | null;
  readonly updatedAt: string;
  readonly assigneeMemberId: string | null;
  readonly assigneeUserId: string | null;
  readonly assigneeDisplayName: string | null;
  readonly assigneeEmail: string | null;
}

interface TicketCommunicationRow {
  readonly entryId: string;
  readonly messageJson: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly authorUserId: string;
  readonly authorDisplayName: string | null;
  readonly authorEmail: string;
}

interface TicketCommentRow {
  readonly commentId: string;
  readonly visibility: string;
  readonly bodyJson: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly authorUserId: string;
  readonly authorDisplayName: string | null;
  readonly authorEmail: string;
}

interface TicketAttachmentRow {
  readonly attachmentId: string;
  readonly visibility: string;
  readonly filename: string;
  readonly contentType: string;
  readonly sizeBytes: number | string;
  readonly createdAt: string;
}

interface CreateTicketCommunicationInput {
  readonly id: string;
  readonly ticketId: string;
  readonly authorUserId: string;
  readonly visibility: "customer" | "internal";
  readonly messageJson: string;
  readonly createdAt: string;
}

interface CreateAuditEventInput {
  readonly id: string;
  readonly actorUserId: string;
  readonly actorType: "internal_user" | "customer_user";
  readonly workspaceId: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly action: string;
  readonly metadataJson: string;
  readonly createdAt: string;
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
    readonly visibility: string;
    readonly updatedAt: string;
    readonly assignee: {
      readonly memberId: string;
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    } | null;
  }[];
}

export interface WorkspaceTicketDetailRecord {
  readonly ticket: {
    readonly id: string;
    readonly ticketNumber: string;
    readonly title: string;
    readonly description: string | null;
    readonly status: string;
    readonly priority: string;
    readonly visibility: string;
    readonly dueDate: string | null;
    readonly updatedAt: string;
    readonly assignee: {
      readonly memberId: string;
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    } | null;
  };
  readonly sections: {
    readonly customerVisibleUpdates: readonly TicketCommunicationRecord[];
    readonly internalNotes: readonly TicketCommunicationRecord[];
    readonly commentsActivity: readonly TicketCommentRecord[];
    readonly attachments: readonly TicketAttachmentRecord[];
  };
}

export interface TicketCommunicationRecord {
  readonly id: string;
  readonly messageJson: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly author: {
    readonly userId: string;
    readonly displayName: string | null;
    readonly email: string;
  };
}

export interface TicketCommentRecord {
  readonly id: string;
  readonly visibility: string;
  readonly bodyJson: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly author: {
    readonly userId: string;
    readonly displayName: string | null;
    readonly email: string;
  };
}

export interface TicketAttachmentRecord {
  readonly id: string;
  readonly visibility: string;
  readonly filename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
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
  options: {
    readonly includeInternalOnly: boolean;
  },
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
          tickets.visibility AS visibility,
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
          AND (? = 1 OR tickets.visibility != 'internal_only')
        ORDER BY tickets.updated_at DESC, tickets.ticket_number DESC
      `,
    )
    .bind(workspaceId, options.includeInternalOnly ? 1 : 0)
    .all<WorkspaceTicketRow>();

  return {
    items: rows.results.map((row) => ({
      id: row.ticketId,
      ticketNumber: row.ticketNumber,
      title: row.title,
      status: row.status,
      priority: row.priority,
      visibility: row.visibility,
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

export async function findWorkspaceTicketDetail(
  database: D1Database,
  workspaceId: string,
  ticketId: string,
  options: {
    readonly includeInternalNotes: boolean;
    readonly includeAttachments: boolean;
  },
): Promise<WorkspaceTicketDetailRecord | null> {
  const row = await database
    .prepare(
      `
        SELECT
          tickets.id AS ticketId,
          tickets.ticket_number AS ticketNumber,
          tickets.title AS title,
          tickets.description AS description,
          tickets.status AS status,
          tickets.priority AS priority,
          tickets.visibility AS visibility,
          tickets.due_date AS dueDate,
          tickets.updated_at AS updatedAt,
          assignee_members.id AS assigneeMemberId,
          assignee_users.id AS assigneeUserId,
          assignee_users.full_name AS assigneeDisplayName,
          assignee_users.email AS assigneeEmail
        FROM tickets
        LEFT JOIN workspace_members AS assignee_members ON assignee_members.id = tickets.assignee_member_id
        LEFT JOIN users AS assignee_users ON assignee_users.id = assignee_members.user_id
        WHERE tickets.workspace_id = ?
          AND tickets.id = ?
          AND tickets.archived_at IS NULL
        LIMIT 1
      `,
    )
    .bind(workspaceId, ticketId)
    .first<WorkspaceTicketDetailRow>();

  if (!row) {
    return null;
  }

  const [customerVisibleUpdates, internalNotes, commentsActivity, attachments] = await Promise.all([
    listTicketCommunicationEntries(database, ticketId, "customer"),
    options.includeInternalNotes ? listTicketCommunicationEntries(database, ticketId, "internal") : Promise.resolve([]),
    listTicketComments(database, ticketId, { includeInternal: options.includeInternalNotes }),
    options.includeAttachments
      ? listTicketAttachments(database, workspaceId, ticketId, { includeInternal: options.includeInternalNotes })
      : Promise.resolve([]),
  ]);

  return {
    ticket: {
      id: row.ticketId,
      ticketNumber: row.ticketNumber,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      visibility: row.visibility,
      dueDate: row.dueDate,
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
    },
    sections: {
      customerVisibleUpdates,
      internalNotes,
      commentsActivity,
      attachments,
    },
  };
}

export async function createTicketCommunicationEntry(
  database: D1Database,
  input: CreateTicketCommunicationInput,
): Promise<void> {
  await database
    .prepare(
      `
        INSERT INTO ticket_updates (
          id,
          ticket_id,
          author_user_id,
          visibility,
          message_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .bind(
      input.id,
      input.ticketId,
      input.authorUserId,
      input.visibility,
      input.messageJson,
      input.createdAt,
      input.createdAt,
    )
    .run();
}

export async function updateTicketTimestamp(
  database: D1Database,
  ticketId: string,
  updatedAt: string,
): Promise<void> {
  await database
    .prepare(
      `
        UPDATE tickets
        SET updated_at = ?
        WHERE id = ?
      `,
    )
    .bind(updatedAt, ticketId)
    .run();
}

export async function createAuditEvent(
  database: D1Database,
  input: CreateAuditEventInput,
): Promise<void> {
  await database
    .prepare(
      `
        INSERT INTO audit_events (
          id,
          actor_user_id,
          actor_type,
          workspace_id,
          resource_type,
          resource_id,
          action,
          metadata_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .bind(
      input.id,
      input.actorUserId,
      input.actorType,
      input.workspaceId,
      input.resourceType,
      input.resourceId,
      input.action,
      input.metadataJson,
      input.createdAt,
    )
    .run();
}

async function listTicketCommunicationEntries(
  database: D1Database,
  ticketId: string,
  visibility: "customer" | "internal",
): Promise<readonly TicketCommunicationRecord[]> {
  const rows = await database
    .prepare(
      `
        SELECT
          ticket_updates.id AS entryId,
          ticket_updates.message_json AS messageJson,
          ticket_updates.created_at AS createdAt,
          ticket_updates.updated_at AS updatedAt,
          users.id AS authorUserId,
          users.full_name AS authorDisplayName,
          users.email AS authorEmail
        FROM ticket_updates
        INNER JOIN users ON users.id = ticket_updates.author_user_id
        WHERE ticket_updates.ticket_id = ?
          AND ticket_updates.visibility = ?
          AND ticket_updates.archived_at IS NULL
        ORDER BY ticket_updates.created_at DESC
      `,
    )
    .bind(ticketId, visibility)
    .all<TicketCommunicationRow>();

  return rows.results.map((row) => ({
    id: row.entryId,
    messageJson: row.messageJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      userId: row.authorUserId,
      displayName: row.authorDisplayName,
      email: row.authorEmail,
    },
  }));
}

async function listTicketComments(
  database: D1Database,
  ticketId: string,
  options: {
    readonly includeInternal: boolean;
  },
): Promise<readonly TicketCommentRecord[]> {
  const rows = await database
    .prepare(
      `
        SELECT
          ticket_comments.id AS commentId,
          ticket_comments.visibility AS visibility,
          ticket_comments.body_json AS bodyJson,
          ticket_comments.created_at AS createdAt,
          ticket_comments.updated_at AS updatedAt,
          users.id AS authorUserId,
          users.full_name AS authorDisplayName,
          users.email AS authorEmail
        FROM ticket_comments
        INNER JOIN users ON users.id = ticket_comments.author_user_id
        WHERE ticket_comments.ticket_id = ?
          AND ticket_comments.archived_at IS NULL
          AND (? = 1 OR ticket_comments.visibility != 'internal')
        ORDER BY ticket_comments.created_at DESC
      `,
    )
    .bind(ticketId, options.includeInternal ? 1 : 0)
    .all<TicketCommentRow>();

  return rows.results.map((row) => ({
    id: row.commentId,
    visibility: row.visibility,
    bodyJson: row.bodyJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      userId: row.authorUserId,
      displayName: row.authorDisplayName,
      email: row.authorEmail,
    },
  }));
}

async function listTicketAttachments(
  database: D1Database,
  workspaceId: string,
  ticketId: string,
  options: {
    readonly includeInternal: boolean;
  },
): Promise<readonly TicketAttachmentRecord[]> {
  const rows = await database
    .prepare(
      `
        SELECT
          attachments.id AS attachmentId,
          attachments.visibility AS visibility,
          attachments.original_filename AS filename,
          attachments.content_type AS contentType,
          attachments.size_bytes AS sizeBytes,
          attachments.created_at AS createdAt
        FROM attachments
        WHERE attachments.workspace_id = ?
          AND attachments.linked_resource_type = 'ticket'
          AND attachments.linked_resource_id = ?
          AND attachments.archived_at IS NULL
          AND (? = 1 OR attachments.visibility != 'internal')
        ORDER BY attachments.created_at DESC
      `,
    )
    .bind(workspaceId, ticketId, options.includeInternal ? 1 : 0)
    .all<TicketAttachmentRow>();

  return rows.results.map((row) => ({
    id: row.attachmentId,
    visibility: row.visibility,
    filename: row.filename,
    contentType: row.contentType,
    sizeBytes: Number(row.sizeBytes),
    createdAt: row.createdAt,
  }));
}
