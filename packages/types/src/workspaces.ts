export const tenantStatusValues = ["active", "suspended", "archived"] as const;
export const userTypeValues = ["internal", "customer"] as const;
export const userStatusValues = ["active"] as const;
export const memberStatusValues = ["active"] as const;

export type TenantStatus = (typeof tenantStatusValues)[number];
export type UserType = (typeof userTypeValues)[number];
export type UserStatus = (typeof userStatusValues)[number];
export type MemberStatus = (typeof memberStatusValues)[number];
