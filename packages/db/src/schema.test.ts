import { describe, expect, it } from "vitest";

import { requiredTableNames, schemaColumnNames } from "./schema";

describe("schema foundations", () => {
  it("track the required tables in docs order", () => {
    expect(requiredTableNames).toEqual([
      "tenants",
      "workspaces",
      "users",
      "workspace_members",
      "invites",
      "sessions",
      "tickets",
      "ticket_updates",
      "ticket_comments",
      "ticket_tags",
      "ticket_tag_links",
      "pages",
      "page_blocks",
      "attachments",
      "share_links",
      "audit_events",
    ]);
  });

  it("preserve exact placeholder column names for key recursive and visibility-sensitive tables", () => {
    expect(schemaColumnNames.pages).toEqual([
      "id",
      "workspace_id",
      "parent_page_id",
      "title",
      "slug",
      "icon",
      "cover_image_key",
      "visibility",
      "created_by_user_id",
      "created_at",
      "updated_at",
      "archived_at",
    ]);

    expect(schemaColumnNames.ticket_comments).toEqual([
      "id",
      "ticket_id",
      "author_user_id",
      "parent_comment_id",
      "visibility",
      "body_json",
      "created_at",
      "updated_at",
      "archived_at",
    ]);
  });
});
