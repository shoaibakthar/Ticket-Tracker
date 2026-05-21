import {
  getGrantedPermissionsForRole,
  hasPermission,
  type AuthenticatedSession,
  type PlatformRole,
  type WorkspaceMembershipSummary,
  type WorkspaceRole,
} from "../../../../packages/auth/src/index";
import type { ApiEnv } from "./env";
import type { SessionBootstrapWorkspaceSummary, SessionLookupRecord } from "./session-store";
import type {
  TicketFieldChangeRecord,
  WorkspaceAttachmentAccessRecord,
  WorkspaceAssignableMemberRecord,
  TicketCommunicationRecord,
  WorkspaceOverviewRecord,
  WorkspaceTicketDetailRecord,
  WorkspaceTicketListRecord,
} from "./workspace-store";
import type { TicketListSort } from "../../../../packages/types/src/index";

const localDevelopmentWorkspace = {
  id: "ws_acme",
  slug: "acme",
  name: "Acme",
  description: "Local development workspace for the seeded preview flow.",
  tenant: {
    id: "tenant_acme",
    slug: "acme",
    name: "Acme",
  },
} as const;

const localDevelopmentUsers = {
  customer: {
    id: "usr_customer_001",
    email: "alex@acme.example",
    displayName: "Alex Customer",
    userType: "customer",
  },
  viewer: {
    id: "usr_customer_002",
    email: "viewer@acme.example",
    displayName: "Casey Viewer",
    userType: "customer",
  },
  internal: {
    id: "usr_internal_001",
    email: "support@observeid.example",
    displayName: "ObserveID Support",
    userType: "internal",
  },
} as const;

const localDevelopmentMemberships = {
  customer: {
    workspaceId: localDevelopmentWorkspace.id,
    workspaceSlug: localDevelopmentWorkspace.slug,
    tenantId: localDevelopmentWorkspace.tenant.id,
    role: "WorkspaceAdmin" as WorkspaceRole,
    memberStatus: "active",
  },
  viewer: {
    workspaceId: localDevelopmentWorkspace.id,
    workspaceSlug: localDevelopmentWorkspace.slug,
    tenantId: localDevelopmentWorkspace.tenant.id,
    role: "Viewer" as WorkspaceRole,
    memberStatus: "active",
  },
  internal: {
    workspaceId: localDevelopmentWorkspace.id,
    workspaceSlug: localDevelopmentWorkspace.slug,
    tenantId: localDevelopmentWorkspace.tenant.id,
    role: "WorkspaceOwner" as WorkspaceRole,
    memberStatus: "active",
  },
} as const;

const localDevelopmentAssignableMembers: readonly WorkspaceAssignableMemberRecord[] = [
  {
    memberId: "wm_customer_001",
    userId: localDevelopmentUsers.customer.id,
    displayName: localDevelopmentUsers.customer.displayName,
    email: localDevelopmentUsers.customer.email,
  },
  {
    memberId: "wm_internal_001",
    userId: localDevelopmentUsers.internal.id,
    displayName: localDevelopmentUsers.internal.displayName,
    email: localDevelopmentUsers.internal.email,
  },
  {
    memberId: "wm_viewer_001",
    userId: localDevelopmentUsers.viewer.id,
    displayName: localDevelopmentUsers.viewer.displayName,
    email: localDevelopmentUsers.viewer.email,
  },
] as const;

const localDevelopmentTicket: {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  visibility: string;
  dueDate: string | null;
  updatedAt: string;
  assignee: WorkspaceTicketDetailRecord["ticket"]["assignee"];
} = {
  id: "tic_001",
  ticketNumber: "TT-001",
  title: "Customer portal preview path",
  description:
    "This seeded local-development ticket exists so the workspace detail route can render before D1 migrations and seed data are applied.",
  status: "Investigating",
  priority: "High",
  visibility: "workspace",
  dueDate: "2026-05-30",
  updatedAt: "2026-05-21T16:30:00.000Z",
  assignee: {
    memberId: "wm_internal_001",
    userId: localDevelopmentUsers.internal.id,
    displayName: localDevelopmentUsers.internal.displayName,
    email: localDevelopmentUsers.internal.email,
  },
};

let localDevelopmentCustomerUpdates: TicketCommunicationRecord[] = [
  {
    id: "upd_customer_001",
    messageJson: JSON.stringify({
      text: "Local development preview is connected to the seeded ticket detail API response.",
    }),
    createdAt: "2026-05-21T12:00:00.000Z",
    updatedAt: "2026-05-21T12:00:00.000Z",
    author: {
      userId: localDevelopmentUsers.internal.id,
      displayName: localDevelopmentUsers.internal.displayName,
      email: localDevelopmentUsers.internal.email,
    },
  },
];

let localDevelopmentInternalNotes: TicketCommunicationRecord[] = [
  {
    id: "upd_internal_001",
    messageJson: JSON.stringify({
      text: "D1 migrations have not been applied locally yet, so this development-only fallback keeps the preview route usable.",
    }),
    createdAt: "2026-05-21T11:30:00.000Z",
    updatedAt: "2026-05-21T11:30:00.000Z",
    author: {
      userId: localDevelopmentUsers.internal.id,
      displayName: localDevelopmentUsers.internal.displayName,
      email: localDevelopmentUsers.internal.email,
    },
  },
];

let localDevelopmentFieldChanges: TicketFieldChangeRecord[] = [
  {
    id: "aud_ticket_001",
    createdAt: "2026-05-21T09:45:00.000Z",
    updatedAt: "2026-05-21T09:45:00.000Z",
    author: {
      userId: localDevelopmentUsers.internal.id,
      displayName: localDevelopmentUsers.internal.displayName,
      email: localDevelopmentUsers.internal.email,
    },
    changes: [
      {
        field: "status",
        label: "Status",
        from: "Open",
        to: "Investigating",
      },
      {
        field: "priority",
        label: "Priority",
        from: "Medium",
        to: "High",
      },
    ],
  },
];

const localDevelopmentComments = [
  {
    id: "cmt_002",
    visibility: "customer",
    bodyJson: JSON.stringify({
      text: "Support confirmed the seeded preview also keeps recent ticket activity visible during local development.",
    }),
    createdAt: "2026-05-21T13:10:00.000Z",
    updatedAt: "2026-05-21T13:10:00.000Z",
    author: {
      userId: localDevelopmentUsers.internal.id,
      displayName: localDevelopmentUsers.internal.displayName,
      email: localDevelopmentUsers.internal.email,
    },
  },
  {
    id: "cmt_001",
    visibility: "customer",
    bodyJson: JSON.stringify({
      text: "Customer confirmed the preview path should load the seeded ticket detail page during local development.",
    }),
    createdAt: "2026-05-21T10:45:00.000Z",
    updatedAt: "2026-05-21T11:05:00.000Z",
    author: {
      userId: localDevelopmentUsers.customer.id,
      displayName: localDevelopmentUsers.customer.displayName,
      email: localDevelopmentUsers.customer.email,
    },
  },
] as const;

const localDevelopmentAttachments = [
  {
    id: "att_002",
    linkedResourceType: "ticket",
    linkedResourceId: localDevelopmentTicket.id,
    r2ObjectKey: "local-development/tickets/tic_001/billing-parser-errors.txt",
    visibility: "customer",
    filename: "billing-parser-errors.txt",
    contentType: "text/plain",
    sizeBytes: 6144,
    createdAt: "2026-05-21T12:40:00.000Z",
    uploadedBy: {
      userId: localDevelopmentUsers.internal.id,
      displayName: localDevelopmentUsers.internal.displayName,
      email: localDevelopmentUsers.internal.email,
    },
  },
  {
    id: "att_001",
    linkedResourceType: "ticket",
    linkedResourceId: localDevelopmentTicket.id,
    r2ObjectKey: "local-development/tickets/tic_001/preview-screenshot.png",
    visibility: "customer",
    filename: "preview-screenshot.png",
    contentType: "image/png",
    sizeBytes: 24576,
    createdAt: "2026-05-21T10:15:00.000Z",
    uploadedBy: {
      userId: localDevelopmentUsers.customer.id,
      displayName: localDevelopmentUsers.customer.displayName,
      email: localDevelopmentUsers.customer.email,
    },
  },
] as const;

const localDevelopmentAttachmentBodies = {
  att_002: new TextEncoder().encode(
    "billing_parser,error_count\ninvoice_total_mismatch,4\nmissing_account_reference,2\n",
  ),
  att_001: Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
} as const;

interface LocalDevelopmentTicketCommunicationInput {
  readonly id: string;
  readonly ticketId: string;
  readonly authorUserId: string;
  readonly visibility: "customer" | "internal";
  readonly messageJson: string;
  readonly createdAt: string;
}

export function shouldUseLocalDevelopmentFallback(env: ApiEnv, error: unknown): boolean {
  return (
    env.APP_ENV === "development" &&
    env.SESSION_DRIVER === "hybrid-friendly-placeholder" &&
    error instanceof Error &&
    /no such table/i.test(error.message)
  );
}

export function findLocalDevelopmentSessionLookupRecord(token: string): SessionLookupRecord | null {
  switch (token) {
    case "customer-token":
      return {
        sessionId: "sess_customer_001",
        userId: localDevelopmentUsers.customer.id,
        userEmail: localDevelopmentUsers.customer.email,
        userDisplayName: localDevelopmentUsers.customer.displayName,
        userType: localDevelopmentUsers.customer.userType,
      };
    case "viewer-token":
      return {
        sessionId: "sess_viewer_001",
        userId: localDevelopmentUsers.viewer.id,
        userEmail: localDevelopmentUsers.viewer.email,
        userDisplayName: localDevelopmentUsers.viewer.displayName,
        userType: localDevelopmentUsers.viewer.userType,
      };
    case "internal-token":
      return {
        sessionId: "sess_internal_001",
        userId: localDevelopmentUsers.internal.id,
        userEmail: localDevelopmentUsers.internal.email,
        userDisplayName: localDevelopmentUsers.internal.displayName,
        userType: localDevelopmentUsers.internal.userType,
      };
    default:
      return null;
  }
}

export function listLocalDevelopmentSessionBootstrapWorkspaces(
  session: AuthenticatedSession,
): readonly SessionBootstrapWorkspaceSummary[] {
  if (session.user.userType === "internal") {
    const platformRole = session.user.platformRole;

    if (!platformRole || !hasPermission(platformRole, "support.cross_workspace_access")) {
      return [];
    }

    return [createInternalBootstrapWorkspace(platformRole)];
  }

  const membership = findLocalDevelopmentWorkspaceMembershipForUser(session.user.id, localDevelopmentWorkspace.slug);

  if (!membership || membership.memberStatus !== "active") {
    return [];
  }

  return [createCustomerBootstrapWorkspace(membership.role, membership.memberStatus)];
}

export function findLocalDevelopmentWorkspaceMembershipForUser(
  userId: string,
  workspaceSlug: string,
): WorkspaceMembershipSummary | null {
  if (workspaceSlug !== localDevelopmentWorkspace.slug) {
    return null;
  }

  if (userId === localDevelopmentUsers.customer.id) {
    return localDevelopmentMemberships.customer;
  }

  if (userId === localDevelopmentUsers.viewer.id) {
    return localDevelopmentMemberships.viewer;
  }

  return null;
}

export function findLocalDevelopmentWorkspaceOverviewBySlug(workspaceSlug: string): WorkspaceOverviewRecord | null {
  if (workspaceSlug !== localDevelopmentWorkspace.slug) {
    return null;
  }

  return {
    workspace: {
      id: localDevelopmentWorkspace.id,
      slug: localDevelopmentWorkspace.slug,
      name: localDevelopmentWorkspace.name,
      description: localDevelopmentWorkspace.description,
      isDefault: true,
      tenant: {
        id: localDevelopmentWorkspace.tenant.id,
        slug: localDevelopmentWorkspace.tenant.slug,
        name: localDevelopmentWorkspace.tenant.name,
      },
    },
    summary: {
      activeMemberCount: 2,
    },
  };
}

export function listLocalDevelopmentWorkspaceTickets(options: {
  readonly workspaceId: string;
  readonly includeInternalOnly: boolean;
  readonly status: string | null | undefined;
  readonly priority: string | null | undefined;
  readonly assigneeMemberId: string | null | undefined;
  readonly query: string | null | undefined;
  readonly sort: TicketListSort | undefined;
}): WorkspaceTicketListRecord {
  if (options.workspaceId !== localDevelopmentWorkspace.id) {
    return { items: [] };
  }

  const searchQuery = options.query?.trim().toLowerCase() ?? null;
  const items =
    (!options.status || localDevelopmentTicket.status.toLowerCase() === options.status.trim().toLowerCase()) &&
    (!options.priority || localDevelopmentTicket.priority.toLowerCase() === options.priority.trim().toLowerCase()) &&
    (!options.assigneeMemberId || localDevelopmentTicket.assignee?.memberId === options.assigneeMemberId) &&
    (!searchQuery ||
      localDevelopmentTicket.ticketNumber.toLowerCase().includes(searchQuery) ||
      localDevelopmentTicket.title.toLowerCase().includes(searchQuery) ||
      localDevelopmentTicket.description.toLowerCase().includes(searchQuery))
      ? [
          {
            id: localDevelopmentTicket.id,
            ticketNumber: localDevelopmentTicket.ticketNumber,
            title: localDevelopmentTicket.title,
            status: localDevelopmentTicket.status,
            priority: localDevelopmentTicket.priority,
            visibility: localDevelopmentTicket.visibility,
            updatedAt: localDevelopmentTicket.updatedAt,
            assignee: localDevelopmentTicket.assignee,
          },
        ]
      : [];

  return {
    items: [...items].sort((left, right) => compareLocalDevelopmentListedTickets(left, right, options.sort ?? "updated_desc")),
  };
}

function compareLocalDevelopmentListedTickets(
  left: WorkspaceTicketListRecord["items"][number],
  right: WorkspaceTicketListRecord["items"][number],
  sort: TicketListSort,
): number {
  switch (sort) {
    case "updated_asc":
      return left.updatedAt.localeCompare(right.updatedAt) || left.ticketNumber.localeCompare(right.ticketNumber);
    case "priority_desc":
      return (
        readLocalDevelopmentPriorityRank(left.priority) - readLocalDevelopmentPriorityRank(right.priority) ||
        right.updatedAt.localeCompare(left.updatedAt) ||
        right.ticketNumber.localeCompare(left.ticketNumber)
      );
    case "updated_desc":
      return right.updatedAt.localeCompare(left.updatedAt) || right.ticketNumber.localeCompare(left.ticketNumber);
  }
}

function readLocalDevelopmentPriorityRank(priority: string): number {
  switch (priority.trim().toLowerCase()) {
    case "urgent":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4;
  }
}

export function findLocalDevelopmentWorkspaceTicketDetail(options: {
  readonly workspaceId: string;
  readonly ticketId: string;
  readonly includeInternalNotes: boolean;
  readonly includeAttachments: boolean;
}): WorkspaceTicketDetailRecord | null {
  if (options.workspaceId !== localDevelopmentWorkspace.id || options.ticketId !== localDevelopmentTicket.id) {
    return null;
  }

  return {
    ticket: {
      id: localDevelopmentTicket.id,
      ticketNumber: localDevelopmentTicket.ticketNumber,
      title: localDevelopmentTicket.title,
      description: localDevelopmentTicket.description,
      status: localDevelopmentTicket.status,
      priority: localDevelopmentTicket.priority,
      visibility: localDevelopmentTicket.visibility,
      dueDate: localDevelopmentTicket.dueDate,
      updatedAt: localDevelopmentTicket.updatedAt,
      assignee: localDevelopmentTicket.assignee,
    },
    sections: {
      customerVisibleUpdates: [...localDevelopmentCustomerUpdates],
      internalNotes: options.includeInternalNotes ? [...localDevelopmentInternalNotes] : [],
      commentsActivity: [...localDevelopmentComments],
      attachments: options.includeAttachments ? [...localDevelopmentAttachments] : [],
      fieldChanges: [...localDevelopmentFieldChanges],
    },
  };
}

export function findLocalDevelopmentWorkspaceAttachmentRecord(
  workspaceId: string,
  attachmentId: string,
): WorkspaceAttachmentAccessRecord | null {
  if (workspaceId !== localDevelopmentWorkspace.id) {
    return null;
  }

  const attachment = localDevelopmentAttachments.find((candidate) => candidate.id === attachmentId);

  if (!attachment) {
    return null;
  }

  return {
    id: attachment.id,
    linkedResourceType: attachment.linkedResourceType,
    linkedResourceId: attachment.linkedResourceId,
    r2ObjectKey: attachment.r2ObjectKey,
    visibility: attachment.visibility,
    filename: attachment.filename,
    contentType: attachment.contentType,
    sizeBytes: attachment.sizeBytes,
    createdAt: attachment.createdAt,
    uploadedBy: attachment.uploadedBy,
    ticketVisibility: localDevelopmentTicket.visibility,
  };
}

export function readLocalDevelopmentAttachmentBody(attachmentId: string): Uint8Array | null {
  return localDevelopmentAttachmentBodies[attachmentId as keyof typeof localDevelopmentAttachmentBodies] ?? null;
}

export function listLocalDevelopmentWorkspaceAssignableMembers(
  workspaceId: string,
): readonly WorkspaceAssignableMemberRecord[] {
  return workspaceId === localDevelopmentWorkspace.id ? [...localDevelopmentAssignableMembers] : [];
}

export function createLocalDevelopmentTicketCommunicationEntry(
  input: LocalDevelopmentTicketCommunicationInput,
): void {
  if (input.ticketId !== localDevelopmentTicket.id) {
    return;
  }

  const author =
    input.authorUserId === localDevelopmentUsers.customer.id
      ? localDevelopmentUsers.customer
      : input.authorUserId === localDevelopmentUsers.viewer.id
        ? localDevelopmentUsers.viewer
        : localDevelopmentUsers.internal;

  const entry: TicketCommunicationRecord = {
    id: input.id,
    messageJson: input.messageJson,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    author: {
      userId: author.id,
      displayName: author.displayName,
      email: author.email,
    },
  };

  if (input.visibility === "internal") {
    localDevelopmentInternalNotes = [entry, ...localDevelopmentInternalNotes];
    return;
  }

  localDevelopmentCustomerUpdates = [entry, ...localDevelopmentCustomerUpdates];
}

export function updateLocalDevelopmentTicketTimestamp(ticketId: string, updatedAt: string): void {
  if (ticketId !== localDevelopmentTicket.id) {
    return;
  }

  localDevelopmentTicket.updatedAt = updatedAt;
}

export function updateLocalDevelopmentTicketFields(options: {
  readonly ticketId: string;
  readonly status: string;
  readonly priority: string;
  readonly assigneeMemberId: string | null;
  readonly dueDate: string | null;
  readonly authorUserId: string;
  readonly updatedAt: string;
  readonly changes: readonly TicketFieldChangeRecord["changes"][number][];
}): void {
  if (options.ticketId !== localDevelopmentTicket.id) {
    return;
  }

  localDevelopmentTicket.status = options.status;
  localDevelopmentTicket.priority = options.priority;
  localDevelopmentTicket.dueDate = options.dueDate;
  localDevelopmentTicket.updatedAt = options.updatedAt;
  localDevelopmentTicket.assignee =
    options.assigneeMemberId === null
      ? null
      : localDevelopmentAssignableMembers.find((member) => member.memberId === options.assigneeMemberId) ?? null;

  const author =
    options.authorUserId === localDevelopmentUsers.customer.id
      ? localDevelopmentUsers.customer
      : options.authorUserId === localDevelopmentUsers.viewer.id
        ? localDevelopmentUsers.viewer
        : localDevelopmentUsers.internal;

  localDevelopmentFieldChanges = [
    {
      id: `aud_${options.updatedAt}`,
      createdAt: options.updatedAt,
      updatedAt: options.updatedAt,
      author: {
        userId: author.id,
        displayName: author.displayName,
        email: author.email,
      },
      changes: [...options.changes],
    },
    ...localDevelopmentFieldChanges,
  ];
}

export function createLocalDevelopmentAuditEvent(): void {
  // Development-only preview writes do not persist audit records outside the running process.
}

function createCustomerBootstrapWorkspace(
  membershipRole: WorkspaceRole,
  memberStatus: string,
): SessionBootstrapWorkspaceSummary {
  return {
    workspaceId: localDevelopmentWorkspace.id,
    workspaceSlug: localDevelopmentWorkspace.slug,
    workspaceName: localDevelopmentWorkspace.name,
    tenantId: localDevelopmentWorkspace.tenant.id,
    tenantSlug: localDevelopmentWorkspace.tenant.slug,
    tenantName: localDevelopmentWorkspace.tenant.name,
    actorRole: membershipRole,
    membershipRole,
    memberStatus,
    accessPath: "workspace-membership",
    grantedPermissions: getGrantedPermissionsForRole(membershipRole),
  };
}

function createInternalBootstrapWorkspace(platformRole: PlatformRole): SessionBootstrapWorkspaceSummary {
  return {
    workspaceId: localDevelopmentWorkspace.id,
    workspaceSlug: localDevelopmentWorkspace.slug,
    workspaceName: localDevelopmentWorkspace.name,
    tenantId: localDevelopmentWorkspace.tenant.id,
    tenantSlug: localDevelopmentWorkspace.tenant.slug,
    tenantName: localDevelopmentWorkspace.tenant.name,
    actorRole: platformRole,
    membershipRole: null,
    memberStatus: null,
    accessPath: "cross-workspace-support",
    grantedPermissions: getGrantedPermissionsForRole(platformRole),
  };
}
