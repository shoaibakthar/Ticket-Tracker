import type { Permission } from "./permissions";
import { allPermissions, isKnownPermission } from "./permissions";
import type { AuthenticatedSession, RequestSession } from "./session";
import type { Role, WorkspaceRole } from "./roles";

export interface PermissionContext {
  readonly role: Role;
  readonly grantedPermissions: readonly Permission[];
}

export interface WorkspaceMembershipSummary {
  readonly workspaceId: string;
  readonly workspaceSlug: string;
  readonly tenantId: string | null;
  readonly role: WorkspaceRole;
  readonly memberStatus: string;
}

export interface AuthorizedWorkspaceAccess {
  readonly status: "authorized";
  readonly workspaceSlug: string;
  readonly actorRole: Role;
  readonly membership: WorkspaceMembershipSummary | null;
  readonly accessPath: "workspace-membership" | "cross-workspace-support";
  readonly grantedPermissions: readonly Permission[];
  readonly session: AuthenticatedSession;
}

export interface UnauthorizedWorkspaceAccess {
  readonly status: "unauthorized";
  readonly workspaceSlug: string;
  readonly reason: "anonymous_session" | "invalid_session";
  readonly session: RequestSession;
}

export interface ForbiddenWorkspaceAccess {
  readonly status: "forbidden";
  readonly workspaceSlug: string;
  readonly reason: "membership_required" | "inactive_membership" | "support_scope_required";
  readonly session: AuthenticatedSession;
}

export type WorkspaceAccessContext =
  | AuthorizedWorkspaceAccess
  | UnauthorizedWorkspaceAccess
  | ForbiddenWorkspaceAccess;

export interface WorkspaceAccessResolutionInput {
  readonly session: RequestSession;
  readonly workspaceSlug: string;
  readonly memberships: readonly WorkspaceMembershipSummary[];
}

export interface AllowedPermissionCheck {
  readonly allowed: true;
  readonly requiredPermission: Permission;
  readonly context: AuthorizedWorkspaceAccess;
}

export interface DeniedPermissionCheck {
  readonly allowed: false;
  readonly requiredPermission: Permission;
  readonly errorCode: "unauthorized" | "forbidden";
  readonly workspaceSlug: string;
  readonly reason:
    | UnauthorizedWorkspaceAccess["reason"]
    | ForbiddenWorkspaceAccess["reason"]
    | "missing_permission";
  readonly missingPermission: Permission | null;
}

export type PermissionCheckResult = AllowedPermissionCheck | DeniedPermissionCheck;

const permissionGrantsByRole = {
  PlatformSuperAdmin: allPermissions,
  PlatformAdmin: allPermissions,
  SupportOperator: [
    "workspace.view",
    "workspace.members.view",
    "workspace.settings.view",
    "tickets.view",
    "tickets.create",
    "tickets.update",
    "tickets.assign",
    "tickets.comment",
    "tickets.attach",
    "tickets.view_internal_notes",
    "tickets.create_internal_notes",
    "tickets.create_customer_updates",
    "tickets.change_status",
    "tickets.manage_views",
    "pages.view",
    "pages.create",
    "pages.update",
    "pages.comment",
    "attachments.view",
    "attachments.upload",
    "shares.create",
    "shares.view",
    "audit.view",
    "tenant.view",
    "support.cross_workspace_access",
  ],
  Auditor: [
    "workspace.view",
    "workspace.members.view",
    "workspace.settings.view",
    "tickets.view",
    "tickets.comment",
    "tickets.view_internal_notes",
    "pages.view",
    "attachments.view",
    "shares.view",
    "audit.view",
    "tenant.view",
    "support.cross_workspace_access",
  ],
  WorkspaceOwner: [
    "workspace.view",
    "workspace.edit",
    "workspace.members.view",
    "workspace.members.manage",
    "workspace.settings.view",
    "workspace.settings.manage",
    "tickets.view",
    "tickets.create",
    "tickets.update",
    "tickets.assign",
    "tickets.comment",
    "tickets.attach",
    "tickets.create_customer_updates",
    "tickets.change_status",
    "tickets.manage_views",
    "pages.view",
    "pages.create",
    "pages.update",
    "pages.delete",
    "pages.share",
    "pages.comment",
    "attachments.view",
    "attachments.upload",
    "attachments.delete",
    "shares.create",
    "shares.view",
    "shares.revoke",
  ],
  WorkspaceAdmin: [
    "workspace.view",
    "workspace.edit",
    "workspace.members.view",
    "workspace.members.manage",
    "workspace.settings.view",
    "tickets.view",
    "tickets.create",
    "tickets.update",
    "tickets.assign",
    "tickets.comment",
    "tickets.attach",
    "tickets.create_customer_updates",
    "tickets.change_status",
    "tickets.manage_views",
    "pages.view",
    "pages.create",
    "pages.update",
    "pages.share",
    "pages.comment",
    "attachments.view",
    "attachments.upload",
    "shares.create",
    "shares.view",
    "shares.revoke",
  ],
  Member: [
    "workspace.view",
    "workspace.members.view",
    "tickets.view",
    "tickets.comment",
    "tickets.attach",
    "pages.view",
    "pages.comment",
    "attachments.view",
  ],
  Viewer: [
    "workspace.view",
    "workspace.members.view",
    "tickets.view",
    "pages.view",
    "attachments.view",
  ],
  Guest: [
    "workspace.view",
    "tickets.view",
    "pages.view",
    "attachments.view",
  ],
  ShareLinkViewer: [],
} as const satisfies Record<Role, readonly Permission[]>;

export const rolePermissionGrants = permissionGrantsByRole;

export function createPermissionContext(role: Role): PermissionContext {
  return {
    role,
    grantedPermissions: getGrantedPermissionsForRole(role),
  };
}

export function getGrantedPermissionsForRole(role: Role): readonly Permission[] {
  return permissionGrantsByRole[role];
}

export function hasPermission(
  contextOrRole: PermissionContext | Role,
  permission: Permission,
): boolean {
  const grantedPermissions =
    typeof contextOrRole === "string"
      ? getGrantedPermissionsForRole(contextOrRole)
      : contextOrRole.grantedPermissions;

  return grantedPermissions.includes(permission);
}

export function resolveWorkspaceAccess({
  session,
  workspaceSlug,
  memberships,
}: WorkspaceAccessResolutionInput): WorkspaceAccessContext {
  if (session.state === "anonymous") {
    return {
      status: "unauthorized",
      workspaceSlug,
      reason: "anonymous_session",
      session,
    };
  }

  if (session.state === "invalid") {
    return {
      status: "unauthorized",
      workspaceSlug,
      reason: "invalid_session",
      session,
    };
  }

  if (session.user.userType === "internal") {
    const internalRole = session.user.platformRole;

    if (!internalRole || !hasPermission(internalRole, "support.cross_workspace_access")) {
      return {
        status: "forbidden",
        workspaceSlug,
        reason: "support_scope_required",
        session,
      };
    }

    return {
      status: "authorized",
      workspaceSlug,
      actorRole: internalRole,
      membership: memberships.find((membership) => membership.workspaceSlug === workspaceSlug) ?? null,
      accessPath: "cross-workspace-support",
      grantedPermissions: getGrantedPermissionsForRole(internalRole),
      session,
    };
  }

  const membership = memberships.find((candidate) => candidate.workspaceSlug === workspaceSlug);

  if (!membership) {
    return {
      status: "forbidden",
      workspaceSlug,
      reason: "membership_required",
      session,
    };
  }

  if (membership.memberStatus !== "active") {
    return {
      status: "forbidden",
      workspaceSlug,
      reason: "inactive_membership",
      session,
    };
  }

  return {
    status: "authorized",
    workspaceSlug,
    actorRole: membership.role,
    membership,
    accessPath: "workspace-membership",
    grantedPermissions: getGrantedPermissionsForRole(membership.role),
    session,
  };
}

export function authorizeWorkspacePermission({
  workspaceAccess,
  requiredPermission,
}: {
  readonly workspaceAccess: WorkspaceAccessContext;
  readonly requiredPermission: Permission;
}): PermissionCheckResult {
  if (workspaceAccess.status === "unauthorized") {
    return {
      allowed: false,
      requiredPermission,
      errorCode: "unauthorized",
      workspaceSlug: workspaceAccess.workspaceSlug,
      reason: workspaceAccess.reason,
      missingPermission: null,
    };
  }

  if (workspaceAccess.status === "forbidden") {
    return {
      allowed: false,
      requiredPermission,
      errorCode: "forbidden",
      workspaceSlug: workspaceAccess.workspaceSlug,
      reason: workspaceAccess.reason,
      missingPermission: null,
    };
  }

  if (!hasPermission(workspaceAccess.actorRole, requiredPermission)) {
    return {
      allowed: false,
      requiredPermission,
      errorCode: "forbidden",
      workspaceSlug: workspaceAccess.workspaceSlug,
      reason: "missing_permission",
      missingPermission: requiredPermission,
    };
  }

  return {
    allowed: true,
    requiredPermission,
    context: workspaceAccess,
  };
}

export function arePermissionsKnown(permissions: readonly string[]): permissions is readonly Permission[] {
  return permissions.every((permission) => isKnownPermission(permission));
}
