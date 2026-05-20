import { describe, expect, it } from "vitest";

import {
  authorizeWorkspacePermission,
  getGrantedPermissionsForRole,
  resolveWorkspaceAccess,
} from "./access";
import { resolveRequestSession } from "./session";

describe("authorization foundation", () => {
  it("keeps workspace admin permissions aligned to the documented defaults", () => {
    expect(getGrantedPermissionsForRole("WorkspaceAdmin")).toEqual([
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
    ]);
  });

  it("resolves active customer membership into workspace access", () => {
    const access = resolveWorkspaceAccess({
      session: resolveRequestSession({
        sessionId: "sess_customer",
        userId: "usr_customer",
        userEmail: "customer@example.com",
        userDisplayName: "Customer User",
        userType: "customer",
        platformRole: null,
      }),
      workspaceSlug: "acme",
      memberships: [
        {
          workspaceId: "wsp_acme",
          workspaceSlug: "acme",
          tenantId: "ten_acme",
          role: "Viewer",
          memberStatus: "active",
        },
      ],
    });

    expect(access).toMatchObject({
      status: "authorized",
      workspaceSlug: "acme",
      actorRole: "Viewer",
      accessPath: "workspace-membership",
    });
  });

  it("allows internal support roles to resolve cross-workspace access without membership rows", () => {
    const access = resolveWorkspaceAccess({
      session: resolveRequestSession({
        sessionId: "sess_support",
        userId: "usr_support",
        userEmail: "support@example.com",
        userDisplayName: "Support User",
        userType: "internal",
        platformRole: "SupportOperator",
      }),
      workspaceSlug: "acme",
      memberships: [],
    });

    expect(access).toMatchObject({
      status: "authorized",
      workspaceSlug: "acme",
      actorRole: "SupportOperator",
      accessPath: "cross-workspace-support",
    });
  });

  it("returns a centralized forbidden decision when the role lacks the required permission", () => {
    const access = resolveWorkspaceAccess({
      session: resolveRequestSession({
        sessionId: "sess_viewer",
        userId: "usr_viewer",
        userEmail: "viewer@example.com",
        userDisplayName: "Viewer User",
        userType: "customer",
        platformRole: null,
      }),
      workspaceSlug: "acme",
      memberships: [
        {
          workspaceId: "wsp_acme",
          workspaceSlug: "acme",
          tenantId: "ten_acme",
          role: "Viewer",
          memberStatus: "active",
        },
      ],
    });

    expect(
      authorizeWorkspacePermission({
        workspaceAccess: access,
        requiredPermission: "shares.create",
      }),
    ).toEqual({
      allowed: false,
      requiredPermission: "shares.create",
      errorCode: "forbidden",
      workspaceSlug: "acme",
      reason: "missing_permission",
      missingPermission: "shares.create",
    });
  });
});
