import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const tenantStatusValues = ["active", "suspended", "archived"] as const;
export const userTypeValues = ["internal", "customer"] as const;
export const userStatusValues = ["active"] as const;
export const memberStatusValues = ["active"] as const;
export const workspaceRoleValues = [
  "WorkspaceOwner",
  "WorkspaceAdmin",
  "Member",
  "Viewer",
  "Guest",
] as const;
export const ticketStatusValues = [
  "New",
  "Open",
  "Investigating",
  "Identified",
  "InProgress",
  "WaitingOnObserveID",
  "WaitingOnCustomer",
  "WaitingOnVendor",
  "Blocked",
  "Monitoring",
  "Resolved",
  "Closed",
] as const;
export const ticketPriorityValues = ["Low", "Medium", "High", "Urgent"] as const;
export const ticketVisibilityValues = [
  "internal_only",
  "customer_visible",
  "restricted_customer_visible",
] as const;
export const updateVisibilityValues = ["internal", "customer"] as const;
export const pageVisibilityValues = [
  "internal_only",
  "workspace_members",
  "restricted_members",
  "shared_link",
] as const;
export const shareScopeValues = ["read"] as const;
export const shareResourceTypeValues = ["page", "ticket", "report", "workspace_view"] as const;
export const attachmentResourceTypeValues = ["ticket", "page", "comment", "update"] as const;
export const auditActorTypeValues = ["internal_user", "customer_user", "share_link"] as const;
export const pageBlockTypeValues = [
  "heading",
  "paragraph",
  "checklist",
  "divider",
  "callout",
  "simple_table",
  "ticket_view",
  "attachment",
  "summary",
] as const;

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: tenantStatusValues }).notNull().default("active"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archivedAt: text("archived_at"),
});

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("workspaces_tenant_slug_unique").on(table.tenantId, table.slug),
    index("workspaces_tenant_idx").on(table.tenantId),
  ],
);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  userType: text("user_type", { enum: userTypeValues }).notNull(),
  status: text("status", { enum: userStatusValues }).notNull().default("active"),
  emailVerifiedAt: text("email_verified_at"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archivedAt: text("archived_at"),
});

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role", { enum: workspaceRoleValues }).notNull(),
    memberStatus: text("member_status", { enum: memberStatusValues }).notNull().default("active"),
    invitedByUserId: text("invited_by_user_id").references(() => users.id),
    joinedAt: text("joined_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("workspace_members_workspace_user_unique").on(table.workspaceId, table.userId),
    index("workspace_members_workspace_idx").on(table.workspaceId),
    index("workspace_members_user_idx").on(table.userId),
  ],
);

export const invites = sqliteTable("invites", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  email: text("email").notNull(),
  role: text("role", { enum: workspaceRoleValues }).notNull(),
  tokenHash: text("token_hash").notNull(),
  invitedByUserId: text("invited_by_user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  acceptedAt: text("accepted_at"),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  sessionTokenHash: text("session_token_hash").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  revokedAt: text("revoked_at"),
  lastSeenAt: text("last_seen_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const tickets = sqliteTable(
  "tickets",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    ticketNumber: text("ticket_number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: ticketStatusValues }).notNull(),
    priority: text("priority", { enum: ticketPriorityValues }).notNull(),
    severity: text("severity"),
    category: text("category"),
    visibility: text("visibility", { enum: ticketVisibilityValues }).notNull().default("customer_visible"),
    assigneeMemberId: text("assignee_member_id").references(() => workspaceMembers.id),
    reporterName: text("reporter_name"),
    dueDate: text("due_date"),
    slaTargetAt: text("sla_target_at"),
    createdByUserId: text("created_by_user_id").references(() => users.id),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("tickets_workspace_ticket_number_unique").on(table.workspaceId, table.ticketNumber),
    index("tickets_workspace_status_idx").on(table.workspaceId, table.status),
    index("tickets_workspace_updated_idx").on(table.workspaceId, table.updatedAt),
    index("tickets_workspace_priority_idx").on(table.workspaceId, table.priority),
  ],
);

export const ticketUpdates = sqliteTable(
  "ticket_updates",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id),
    visibility: text("visibility", { enum: updateVisibilityValues }).notNull(),
    messageJson: text("message_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [index("ticket_updates_ticket_created_idx").on(table.ticketId, table.createdAt)],
);

export const ticketComments = sqliteTable(
  "ticket_comments",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id),
    parentCommentId: text("parent_comment_id").references((): AnySQLiteColumn => ticketComments.id),
    visibility: text("visibility", { enum: updateVisibilityValues }).notNull().default("customer"),
    bodyJson: text("body_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [index("ticket_comments_ticket_created_idx").on(table.ticketId, table.createdAt)],
);

export const ticketTags = sqliteTable(
  "ticket_tags",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("ticket_tags_workspace_name_unique").on(table.workspaceId, table.name)],
);

export const ticketTagLinks = sqliteTable(
  "ticket_tag_links",
  {
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id),
    tagId: text("tag_id")
      .notNull()
      .references(() => ticketTags.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.ticketId, table.tagId] })],
);

export const pages = sqliteTable(
  "pages",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    parentPageId: text("parent_page_id").references((): AnySQLiteColumn => pages.id),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    icon: text("icon"),
    coverImageKey: text("cover_image_key"),
    visibility: text("visibility", { enum: pageVisibilityValues }).notNull().default("workspace_members"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    uniqueIndex("pages_workspace_slug_unique").on(table.workspaceId, table.slug),
    index("pages_workspace_parent_idx").on(table.workspaceId, table.parentPageId),
  ],
);

export const pageBlocks = sqliteTable(
  "page_blocks",
  {
    id: text("id").primaryKey(),
    pageId: text("page_id")
      .notNull()
      .references(() => pages.id),
    blockType: text("block_type", { enum: pageBlockTypeValues }).notNull(),
    position: integer("position").notNull(),
    contentJson: text("content_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [uniqueIndex("page_blocks_page_position_unique").on(table.pageId, table.position)],
);

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    linkedResourceType: text("linked_resource_type", { enum: attachmentResourceTypeValues }).notNull(),
    linkedResourceId: text("linked_resource_id").notNull(),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => users.id),
    r2ObjectKey: text("r2_object_key").notNull().unique(),
    originalFilename: text("original_filename").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    visibility: text("visibility").notNull(),
    createdAt: text("created_at").notNull(),
    archivedAt: text("archived_at"),
  },
  (table) => [
    index("attachments_workspace_resource_idx").on(
      table.workspaceId,
      table.linkedResourceType,
      table.linkedResourceId,
    ),
  ],
);

export const shareLinks = sqliteTable(
  "share_links",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    resourceType: text("resource_type", { enum: shareResourceTypeValues }).notNull(),
    resourceId: text("resource_id").notNull(),
    permissionScope: text("permission_scope", { enum: shareScopeValues }).notNull().default("read"),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: text("expires_at"),
    revokedAt: text("revoked_at"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull(),
    lastAccessedAt: text("last_accessed_at"),
  },
  (table) => [index("share_links_workspace_resource_idx").on(table.workspaceId, table.resourceType, table.resourceId)],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id),
    actorType: text("actor_type", { enum: auditActorTypeValues }).notNull(),
    workspaceId: text("workspace_id").references(() => workspaces.id),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    action: text("action").notNull(),
    metadataJson: text("metadata_json"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("audit_events_workspace_created_idx").on(table.workspaceId, table.createdAt),
    index("audit_events_actor_created_idx").on(table.actorUserId, table.createdAt),
  ],
);

export const requiredTableNames = [
  "tenants",
  "workspaces",
  "users",
  "workspace_members",
  "invites",
  "sessions",
  "tickets",
  "ticket_updates",
  "ticket_comments",
  "ticket_tags",
  "ticket_tag_links",
  "pages",
  "page_blocks",
  "attachments",
  "share_links",
  "audit_events",
] as const;

export const initialSchemaAssumptions = {
  internalAndCustomerUsersShareUsersTable: true,
  sessionPersistenceModel: "hybrid-friendly-placeholder",
  shareLinksDefaultToReadOnly: true,
  pageCommentsIncludedInV1: false,
  savedViewsIncludedInV1: false,
} as const;

export const schemaColumnNames = {
  tenants: ["id", "name", "slug", "status", "created_at", "updated_at", "archived_at"],
  workspaces: ["id", "tenant_id", "name", "slug", "description", "is_default", "created_at", "updated_at", "archived_at"],
  users: ["id", "email", "full_name", "user_type", "status", "email_verified_at", "last_login_at", "created_at", "updated_at", "archived_at"],
  workspace_members: ["id", "workspace_id", "user_id", "role", "member_status", "invited_by_user_id", "joined_at", "created_at", "updated_at", "archived_at"],
  invites: ["id", "workspace_id", "email", "role", "token_hash", "invited_by_user_id", "expires_at", "accepted_at", "revoked_at", "created_at"],
  sessions: ["id", "user_id", "session_token_hash", "created_at", "expires_at", "revoked_at", "last_seen_at", "ip_address", "user_agent"],
  tickets: ["id", "workspace_id", "ticket_number", "title", "description", "status", "priority", "severity", "category", "visibility", "assignee_member_id", "reporter_name", "due_date", "sla_target_at", "created_by_user_id", "created_at", "updated_at", "archived_at"],
  ticket_updates: ["id", "ticket_id", "author_user_id", "visibility", "message_json", "created_at", "updated_at", "archived_at"],
  ticket_comments: ["id", "ticket_id", "author_user_id", "parent_comment_id", "visibility", "body_json", "created_at", "updated_at", "archived_at"],
  ticket_tags: ["id", "workspace_id", "name", "color", "created_at"],
  ticket_tag_links: ["ticket_id", "tag_id", "created_at"],
  pages: ["id", "workspace_id", "parent_page_id", "title", "slug", "icon", "cover_image_key", "visibility", "created_by_user_id", "created_at", "updated_at", "archived_at"],
  page_blocks: ["id", "page_id", "block_type", "position", "content_json", "created_at", "updated_at", "archived_at"],
  attachments: ["id", "workspace_id", "linked_resource_type", "linked_resource_id", "uploaded_by_user_id", "r2_object_key", "original_filename", "content_type", "size_bytes", "visibility", "created_at", "archived_at"],
  share_links: ["id", "workspace_id", "resource_type", "resource_id", "permission_scope", "token_hash", "expires_at", "revoked_at", "created_by_user_id", "created_at", "last_accessed_at"],
  audit_events: ["id", "actor_user_id", "actor_type", "workspace_id", "resource_type", "resource_id", "action", "metadata_json", "ip_address", "user_agent", "created_at"],
} as const;

export const schemaPlaceholder = {
  migrationDirectory: "packages/db/migrations",
  probeQuery: sql`select 1`,
  requiredTableNames,
  schemaColumnNames,
  assumptions: initialSchemaAssumptions,
  status: "foundation-placeholder",
} as const;
