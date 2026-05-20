import { describe, expect, it } from "vitest";

import { allPermissions, permissionCatalog } from "./permissions";

describe("permission constants", () => {
  it("match the permission catalog in docs order", () => {
    expect(allPermissions).toEqual([
      "workspace.view",
      "workspace.edit",
      "workspace.archive",
      "workspace.members.view",
      "workspace.members.manage",
      "workspace.settings.view",
      "workspace.settings.manage",
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
      "audit.view",
      "tenant.view",
      "tenant.manage",
      "support.cross_workspace_access",
    ]);
  });

  it("uses category names that mirror the spec sections", () => {
    expect(Object.keys(permissionCatalog)).toEqual([
      "workspace",
      "ticket",
      "page",
      "attachment",
      "shareLink",
      "audit",
      "tenantAdmin",
    ]);
  });
});
