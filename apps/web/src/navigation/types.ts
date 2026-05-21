import type { ReactElement } from "react";
import type { Permission } from "../../../../packages/auth/src/permissions";
import type { Role, WorkspaceRole } from "../../../../packages/auth/src/roles";

export type PlaceholderRouteId =
  | "workspace-overview"
  | "tickets"
  | "pages"
  | "files"
  | "members"
  | "share-links"
  | "settings";

export interface PlaceholderScreenProps {
  readonly workspaceSlug: string;
  readonly routeState: WorkspaceRouteState;
  readonly requiredPermissions: readonly Permission[];
  readonly sessionBootstrap: SessionBootstrapData | null;
  readonly workspaceOverview: WorkspaceOverviewData | null;
  readonly ticketList: TicketListData | null;
  readonly ticketListError: string | null;
  readonly ticketDetail: TicketDetailData | null;
  readonly ticketDetailError: string | null;
}

export interface PlaceholderRouteModule {
  readonly id: PlaceholderRouteId;
  readonly pathTemplate: string;
  readonly title: string;
  readonly summary: string;
  readonly navigationLabel: string;
  readonly placeholder: true;
  readonly requiredPermissions: readonly Permission[];
  readonly buildPath: (workspaceSlug: string) => string;
  readonly renderScreen: (props: PlaceholderScreenProps) => ReactElement;
}

export interface WorkspaceRouteGuard {
  readonly strategy: "authenticated-workspace-membership";
  readonly fallbackPath: "/not-authorized";
  readonly requiredPermissions: readonly Permission[];
}

export interface WorkspaceRouteAuthorizationPlaceholder {
  readonly sessionState: "pending" | "authenticated";
  readonly permissionState: "pending" | "authorized";
  readonly missingPermissions: readonly Permission[];
}

export interface WorkspaceRouteState {
  readonly kind: "workspace";
  readonly pathname: string;
  readonly workspaceSlug: string;
  readonly routeId: PlaceholderRouteId;
  readonly ticketId: string | null;
  readonly route: PlaceholderRouteModule;
  readonly access: "protected";
  readonly authState: "pending";
  readonly routeGuard: WorkspaceRouteGuard;
  readonly authorization: WorkspaceRouteAuthorizationPlaceholder;
}

export interface SharedRouteState {
  readonly kind: "shared";
  readonly pathname: string;
  readonly token: string;
  readonly access: "shared";
}

export interface NotAuthorizedRouteState {
  readonly kind: "not-authorized";
  readonly pathname: "/not-authorized";
  readonly access: "public";
  readonly attemptedPath: string | null;
  readonly missingPermissions: readonly Permission[];
}

export interface NotFoundRouteState {
  readonly kind: "not-found";
  readonly pathname: string;
  readonly access: "public";
}

export type AppRouteState =
  | WorkspaceRouteState
  | SharedRouteState
  | NotAuthorizedRouteState
  | NotFoundRouteState;

export interface SidebarNavigationItem {
  readonly routeId: PlaceholderRouteId;
  readonly label: string;
  readonly href: string;
  readonly current: boolean;
}

export interface SidebarNavigationSection {
  readonly id: "workspace" | "collaboration" | "administration";
  readonly title: string;
  readonly items: readonly SidebarNavigationItem[];
}

export interface WorkspaceSwitcherItem {
  readonly workspaceSlug: string;
  readonly workspaceName: string;
  readonly href: string;
  readonly current: boolean;
}

export interface RenderedShellOptions {
  readonly workspaceSlug?: string;
  readonly activeRouteId?: PlaceholderRouteId;
}

export interface RouteAuthorizationSnapshot {
  readonly sessionState: "pending" | "anonymous" | "authenticated";
  readonly grantedPermissions: readonly Permission[];
}

export interface SessionBootstrapUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly userType: "internal" | "customer";
}

export interface SessionBootstrapWorkspace {
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

export interface SessionBootstrapData {
  readonly authenticated: boolean;
  readonly user: SessionBootstrapUser | null;
  readonly session: {
    readonly state: "anonymous" | "invalid" | "authenticated";
    readonly driver: string;
    readonly providerModel: string;
    readonly source: string;
  };
  readonly workspaces: readonly SessionBootstrapWorkspace[];
}

export interface WorkspaceOverviewData {
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
  readonly membership: {
    readonly role: WorkspaceRole;
    readonly memberStatus: string;
  } | null;
  readonly access: {
    readonly actorRole: Role;
    readonly accessPath: "workspace-membership" | "cross-workspace-support";
    readonly canViewMembers: boolean;
    readonly canViewSettings: boolean;
  };
}

export interface TicketListItem {
  readonly id: string;
  readonly ticketNumber: string;
  readonly title: string;
  readonly status: string;
  readonly priority: string;
  readonly href: string;
  readonly updatedAt: string;
  readonly assignee: {
    readonly memberId: string;
    readonly userId: string;
    readonly displayName: string | null;
    readonly email: string;
  } | null;
}

export interface TicketListData {
  readonly workspace: {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
  };
  readonly items: readonly TicketListItem[];
}

export interface TicketDetailData {
  readonly workspace: {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
  };
  readonly ticket: {
    readonly id: string;
    readonly ticketNumber: string;
    readonly title: string;
    readonly description: string | null;
    readonly status: string;
    readonly priority: string;
    readonly dueDate: string | null;
    readonly updatedAt: string;
    readonly assignee: {
      readonly memberId: string;
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    } | null;
  };
  readonly summary: {
    readonly currentStanding: string;
  };
  readonly sections: {
    readonly customerVisibleUpdates: readonly TicketCommunicationEntry[];
    readonly internalNotes: readonly TicketCommunicationEntry[] | null;
    readonly commentsActivity: readonly TicketActivityEntry[];
    readonly attachments: readonly TicketAttachmentSummary[];
  };
  readonly access: {
    readonly actorRole: Role;
    readonly accessPath: "workspace-membership" | "cross-workspace-support";
    readonly canViewInternalNotes: boolean;
    readonly canViewAttachments: boolean;
    readonly canCreateInternalNotes: boolean;
    readonly canCreateCustomerUpdates: boolean;
  };
}

export interface TicketCommunicationEntry {
  readonly id: string;
  readonly message: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly author: {
    readonly userId: string;
    readonly displayName: string | null;
    readonly email: string;
  };
}

export interface TicketActivityEntry {
  readonly id: string;
  readonly kind: "comment";
  readonly visibility: "customer" | "internal";
  readonly message: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly author: {
    readonly userId: string;
    readonly displayName: string | null;
    readonly email: string;
  };
}

export interface TicketAttachmentSummary {
  readonly id: string;
  readonly visibility: "customer" | "internal";
  readonly filename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
}
