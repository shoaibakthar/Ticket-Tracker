export const ticketVisibilityValues = [
  "internal_only",
  "customer_visible",
  "restricted_customer_visible",
] as const;

export const ticketUpdateVisibilityValues = ["internal", "customer"] as const;

export const pageVisibilityValues = [
  "internal_only",
  "workspace_members",
  "restricted_members",
  "shared_link",
] as const;

export const sharePermissionScopeValues = ["read"] as const;

export type TicketVisibility = (typeof ticketVisibilityValues)[number];
export type TicketUpdateVisibility = (typeof ticketUpdateVisibilityValues)[number];
export type PageVisibility = (typeof pageVisibilityValues)[number];
export type SharePermissionScope = (typeof sharePermissionScopeValues)[number];
