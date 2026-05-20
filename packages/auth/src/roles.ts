export const platformRoles = [
  "PlatformSuperAdmin",
  "PlatformAdmin",
  "SupportOperator",
  "Auditor",
] as const;

export const workspaceRoles = [
  "WorkspaceOwner",
  "WorkspaceAdmin",
  "Member",
  "Viewer",
  "Guest",
] as const;

export const externalRoles = ["ShareLinkViewer"] as const;

export const allRoles = [
  ...platformRoles,
  ...workspaceRoles,
  ...externalRoles,
] as const;

export type PlatformRole = (typeof platformRoles)[number];
export type WorkspaceRole = (typeof workspaceRoles)[number];
export type ExternalRole = (typeof externalRoles)[number];
export type Role = (typeof allRoles)[number];

export const roleGroups = {
  platform: platformRoles,
  workspace: workspaceRoles,
  external: externalRoles,
} as const;
