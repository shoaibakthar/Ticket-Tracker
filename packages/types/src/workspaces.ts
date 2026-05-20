export const tenantStatusValues = ["active", "suspended", "archived"] as const;
export const workspaceStatusValues = ["active", "archived"] as const;
export const userTypeValues = ["internal", "customer"] as const;
export const workspaceMemberStatusValues = ["active", "archived"] as const;

export type TenantStatus = (typeof tenantStatusValues)[number];
export type WorkspaceStatus = (typeof workspaceStatusValues)[number];
export type UserType = (typeof userTypeValues)[number];
export type WorkspaceMemberStatus = (typeof workspaceMemberStatusValues)[number];
