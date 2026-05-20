export const workspacePermissions = [
  "workspace.view",
  "workspace.edit",
  "workspace.archive",
  "workspace.members.view",
  "workspace.members.manage",
  "workspace.settings.view",
  "workspace.settings.manage",
] as const;

export const ticketPermissions = [
  "tickets.view",
  "tickets.create",
  "tickets.update",
  "tickets.delete",
  "tickets.assign",
  "tickets.comment",
  "tickets.attach",
  "tickets.view_internal_notes",
  "tickets.create_internal_notes",
  "tickets.create_customer_updates",
  "tickets.change_status",
  "tickets.manage_views",
] as const;

export const pagePermissions = [
  "pages.view",
  "pages.create",
  "pages.update",
  "pages.delete",
  "pages.share",
  "pages.comment",
] as const;

export const attachmentPermissions = [
  "attachments.view",
  "attachments.upload",
  "attachments.delete",
] as const;

export const sharePermissions = [
  "shares.create",
  "shares.view",
  "shares.revoke",
] as const;

export const auditPermissions = ["audit.view"] as const;

export const tenantPermissions = [
  "tenant.view",
  "tenant.manage",
  "support.cross_workspace_access",
] as const;

export const permissionCatalog = {
  workspace: workspacePermissions,
  ticket: ticketPermissions,
  page: pagePermissions,
  attachment: attachmentPermissions,
  share: sharePermissions,
  audit: auditPermissions,
  tenant: tenantPermissions,
} as const;

export const allPermissions = [
  ...workspacePermissions,
  ...ticketPermissions,
  ...pagePermissions,
  ...attachmentPermissions,
  ...sharePermissions,
  ...auditPermissions,
  ...tenantPermissions,
] as const;

export type Permission = (typeof allPermissions)[number];
