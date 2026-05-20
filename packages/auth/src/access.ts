import { allPermissions, type Permission } from "./permissions";
import { allRoles, type Role } from "./roles";

export interface AccessCheckPlaceholder {
  readonly ready: false;
  readonly nextPhase: "auth-foundation";
}

export interface PermissionContextPlaceholder {
  readonly role: Role;
  readonly grantedPermissions: readonly Permission[];
}

export function createAccessCheckPlaceholder(): AccessCheckPlaceholder {
  return {
    ready: false,
    nextPhase: "auth-foundation",
  };
}

export function isKnownRole(value: string): value is Role {
  return allRoles.includes(value as Role);
}

export function isKnownPermission(value: string): value is Permission {
  return allPermissions.includes(value as Permission);
}
