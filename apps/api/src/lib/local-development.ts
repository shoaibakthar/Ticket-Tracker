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
  WorkspaceOverviewRecord,
  WorkspaceTicketDetailRecord,
  WorkspaceTicketListRecord,
} from "./workspace-store";

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
} as const;

const localDevelopmentTicket = {
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
} as const;

const localDevelopmentCustomerUpdates = [
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
] as const;

const localDevelopmentInternalNotes = [
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
] as const;

const localDevelopmentComments = [
  {
    id: "cmt_001",
    visibility: "customer",
    bodyJson: JSON.stringify({
      text: "Customer confirmed the preview path should load the seeded ticket detail page during local development.",
    }),
    createdAt: "2026-05-21T10:45:00.000Z",
    updatedAt: "2026-05-21T10:45:00.000Z",
    author: {
      userId: localDevelopmentUsers.customer.id,
      displayName: localDevelopmentUsers.customer.displayName,
      email: localDevelopmentUsers.customer.email,
    },
  },
] as const;

const localDevelopmentAttachments = [
  {
    id: "att_001",
    visibility: "customer",
    filename: "preview-screenshot.png",
    contentType: "image/png",
    sizeBytes: 24576,
    createdAt: "2026-05-21T10:15:00.000Z",
  },
] as const;

export function shouldUseLocalDevelopmentFallback(env: ApiEnv, error: unknown): boolean {
  return env.APP_ENV === "development" && error instanceof Error && /no such table/i.test(error.message);
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
}): WorkspaceTicketListRecord {
  if (options.workspaceId !== localDevelopmentWorkspace.id) {
    return { items: [] };
  }

  return {
    items: [
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
    ],
  };
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
    },
  };
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
