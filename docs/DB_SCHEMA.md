# ObserveID Ticket Tracker — Database Schema Draft

## 1. Purpose
This document defines the initial relational schema for the ObserveID Ticket Tracker.
It complements:
- `docs/BUILD_PLAN.md`
- `docs/PERMISSIONS_MATRIX.md`
- `docs/MVP_SCOPE.md`

This schema is intended for Cloudflare D1 and should be implemented through migrations.

---

## 2. Design Goals
- Support multi-tenant isolation
- Support workspace-based collaboration
- Support strict membership and role mapping
- Support tickets, updates, comments, pages, attachments, and share links
- Keep v1 schema understandable and maintainable
- Prefer additive migrations over destructive changes

---

## 3. Core Modeling Decisions

### Multi-tenancy
- A tenant represents a customer account boundary
- A tenant can have one or more workspaces
- Most customer-facing data should be scoped through `workspace_id`

### Roles
For v1, roles can be stored as enumerated values on membership records.
If future flexibility is needed, role-permission joins can be expanded.

### Soft delete strategy
Prefer archive/revoke timestamps for important records rather than hard delete.

---

## 4. Table Overview

Required tables:
- tenants
- workspaces
- users
- workspace_members
- invites
- sessions
- tickets
- ticket_updates
- ticket_comments
- ticket_tags
- ticket_tag_links
- pages
- page_blocks
- attachments
- share_links
- audit_events

Optional later tables:
- saved_views
- notifications
- activity_feed_entries
- page_comments
- oauth_accounts

---

## 5. Proposed Tables

## tenants
Represents a customer organization.

### Fields
- id TEXT PRIMARY KEY
- name TEXT NOT NULL
- slug TEXT NOT NULL UNIQUE
- status TEXT NOT NULL DEFAULT 'active'
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- archived_at TEXT

### Notes
- `slug` should be unique and URL-safe
- status examples: active, suspended, archived

---

## workspaces
Represents an operational container under a tenant.

### Fields
- id TEXT PRIMARY KEY
- tenant_id TEXT NOT NULL
- name TEXT NOT NULL
- slug TEXT NOT NULL
- description TEXT
- is_default INTEGER NOT NULL DEFAULT 0
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- archived_at TEXT

### Foreign keys
- tenant_id -> tenants.id

### Constraints
- UNIQUE (tenant_id, slug)

---

## users
Represents all authenticated users, both internal and customer-facing.

### Fields
- id TEXT PRIMARY KEY
- email TEXT NOT NULL UNIQUE
- full_name TEXT
- user_type TEXT NOT NULL
- status TEXT NOT NULL DEFAULT 'active'
- email_verified_at TEXT
- last_login_at TEXT
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- archived_at TEXT

### Notes
- user_type examples: internal, customer
- keep auth-provider-specific fields separate if needed later

---

## workspace_members
Maps users to workspaces and roles.

### Fields
- id TEXT PRIMARY KEY
- workspace_id TEXT NOT NULL
- user_id TEXT NOT NULL
- role TEXT NOT NULL
- member_status TEXT NOT NULL DEFAULT 'active'
- invited_by_user_id TEXT
- joined_at TEXT
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- archived_at TEXT

### Foreign keys
- workspace_id -> workspaces.id
- user_id -> users.id
- invited_by_user_id -> users.id

### Constraints
- UNIQUE (workspace_id, user_id)

### Notes
- role examples: WorkspaceOwner, WorkspaceAdmin, Member, Viewer, Guest

---

## invites
Invite workflow for adding users to workspaces.

### Fields
- id TEXT PRIMARY KEY
- workspace_id TEXT NOT NULL
- email TEXT NOT NULL
- role TEXT NOT NULL
- token_hash TEXT NOT NULL
- invited_by_user_id TEXT NOT NULL
- expires_at TEXT NOT NULL
- accepted_at TEXT
- revoked_at TEXT
- created_at TEXT NOT NULL

### Foreign keys
- workspace_id -> workspaces.id
- invited_by_user_id -> users.id

---

## sessions
Application-managed session records if needed for audit and revocation.

### Fields
- id TEXT PRIMARY KEY
- user_id TEXT NOT NULL
- session_token_hash TEXT NOT NULL
- created_at TEXT NOT NULL
- expires_at TEXT NOT NULL
- revoked_at TEXT
- last_seen_at TEXT
- ip_address TEXT
- user_agent TEXT

### Foreign keys
- user_id -> users.id

---

## tickets
Primary ticket record.

### Fields
- id TEXT PRIMARY KEY
- workspace_id TEXT NOT NULL
- ticket_number TEXT NOT NULL
- title TEXT NOT NULL
- description TEXT
- status TEXT NOT NULL
- priority TEXT NOT NULL
- severity TEXT
- category TEXT
- visibility TEXT NOT NULL DEFAULT 'customer_visible'
- assignee_member_id TEXT
- reporter_name TEXT
- due_date TEXT
- sla_target_at TEXT
- created_by_user_id TEXT
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- archived_at TEXT

### Foreign keys
- workspace_id -> workspaces.id
- assignee_member_id -> workspace_members.id
- created_by_user_id -> users.id

### Constraints
- UNIQUE (workspace_id, ticket_number)

### Notes
- status examples: New, Open, InProgress, WaitingOnObserveID, WaitingOnCustomer, Blocked, Resolved, Closed
- visibility examples: internal_only, customer_visible, restricted_customer_visible

---

## ticket_updates
Timeline updates for tickets.

### Fields
- id TEXT PRIMARY KEY
- ticket_id TEXT NOT NULL
- author_user_id TEXT NOT NULL
- visibility TEXT NOT NULL
- message_json TEXT NOT NULL
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- archived_at TEXT

### Foreign keys
- ticket_id -> tickets.id
- author_user_id -> users.id

### Notes
- visibility values: internal, customer
- `message_json` allows rich text/block-compatible content

---

## ticket_comments
Threaded or flat comments for tickets.

### Fields
- id TEXT PRIMARY KEY
- ticket_id TEXT NOT NULL
- author_user_id TEXT NOT NULL
- parent_comment_id TEXT
- visibility TEXT NOT NULL DEFAULT 'customer'
- body_json TEXT NOT NULL
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- archived_at TEXT

### Foreign keys
- ticket_id -> tickets.id
- author_user_id -> users.id
- parent_comment_id -> ticket_comments.id

---

## ticket_tags
Master ticket tag list per workspace.

### Fields
- id TEXT PRIMARY KEY
- workspace_id TEXT NOT NULL
- name TEXT NOT NULL
- color TEXT
- created_at TEXT NOT NULL

### Foreign keys
- workspace_id -> workspaces.id

### Constraints
- UNIQUE (workspace_id, name)

---

## ticket_tag_links
Many-to-many between tickets and tags.

### Fields
- ticket_id TEXT NOT NULL
- tag_id TEXT NOT NULL
- created_at TEXT NOT NULL

### Foreign keys
- ticket_id -> tickets.id
- tag_id -> ticket_tags.id

### Constraints
- PRIMARY KEY (ticket_id, tag_id)

---

## pages
Workspace pages for Notion-like content.

### Fields
- id TEXT PRIMARY KEY
- workspace_id TEXT NOT NULL
- parent_page_id TEXT
- title TEXT NOT NULL
- slug TEXT NOT NULL
- icon TEXT
- cover_image_key TEXT
- visibility TEXT NOT NULL DEFAULT 'workspace_members'
- created_by_user_id TEXT NOT NULL
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- archived_at TEXT

### Foreign keys
- workspace_id -> workspaces.id
- parent_page_id -> pages.id
- created_by_user_id -> users.id

### Constraints
- UNIQUE (workspace_id, slug)

---

## page_blocks
Stores page block content in ordered form.

### Fields
- id TEXT PRIMARY KEY
- page_id TEXT NOT NULL
- block_type TEXT NOT NULL
- position INTEGER NOT NULL
- content_json TEXT NOT NULL
- created_at TEXT NOT NULL
- updated_at TEXT NOT NULL
- archived_at TEXT

### Foreign keys
- page_id -> pages.id

### Constraints
- UNIQUE (page_id, position)

### Notes
- block_type examples: heading, paragraph, checklist, divider, callout, simple_table, ticket_view, attachment, summary

---

## attachments
Metadata for files stored in R2.

### Fields
- id TEXT PRIMARY KEY
- workspace_id TEXT NOT NULL
- linked_resource_type TEXT NOT NULL
- linked_resource_id TEXT NOT NULL
- uploaded_by_user_id TEXT NOT NULL
- r2_object_key TEXT NOT NULL UNIQUE
- original_filename TEXT NOT NULL
- content_type TEXT NOT NULL
- size_bytes INTEGER NOT NULL
- visibility TEXT NOT NULL
- created_at TEXT NOT NULL
- archived_at TEXT

### Foreign keys
- workspace_id -> workspaces.id
- uploaded_by_user_id -> users.id

### Notes
- linked_resource_type examples: ticket, page, comment, update

---

## share_links
Tokenized shareable links.

### Fields
- id TEXT PRIMARY KEY
- workspace_id TEXT NOT NULL
- resource_type TEXT NOT NULL
- resource_id TEXT NOT NULL
- permission_scope TEXT NOT NULL DEFAULT 'read'
- token_hash TEXT NOT NULL UNIQUE
- expires_at TEXT
- revoked_at TEXT
- created_by_user_id TEXT NOT NULL
- created_at TEXT NOT NULL
- last_accessed_at TEXT

### Foreign keys
- workspace_id -> workspaces.id
- created_by_user_id -> users.id

### Notes
- resource_type examples: page, ticket, report, workspace_view

---

## audit_events
Immutable or append-only operational audit trail.

### Fields
- id TEXT PRIMARY KEY
- actor_user_id TEXT
- actor_type TEXT NOT NULL
- workspace_id TEXT
- resource_type TEXT NOT NULL
- resource_id TEXT
- action TEXT NOT NULL
- metadata_json TEXT
- ip_address TEXT
- user_agent TEXT
- created_at TEXT NOT NULL

### Foreign keys
- actor_user_id -> users.id
- workspace_id -> workspaces.id

### Notes
- actor_type examples: internal_user, customer_user, share_link

---

## 6. Index Recommendations

Recommended indexes:
- workspaces(tenant_id)
- workspace_members(workspace_id)
- workspace_members(user_id)
- tickets(workspace_id, status)
- tickets(workspace_id, updated_at)
- tickets(workspace_id, priority)
- ticket_updates(ticket_id, created_at)
- ticket_comments(ticket_id, created_at)
- pages(workspace_id, parent_page_id)
- attachments(workspace_id, linked_resource_type, linked_resource_id)
- share_links(workspace_id, resource_type, resource_id)
- audit_events(workspace_id, created_at)
- audit_events(actor_user_id, created_at)

---

## 7. Data Integrity Rules
- Ticket records must always belong to a workspace
- Workspace must always belong to a tenant
- Membership must be unique per user/workspace pair
- Share links must be revocable without deleting historical records
- Attachments must never exist without workspace scoping
- Internal ticket data must use visibility flags to support safe filtering

---

## 8. Migration Strategy

### Initial migration set should create
1. tenants
2. workspaces
3. users
4. workspace_members
5. invites
6. sessions
7. tickets
8. ticket_updates
9. ticket_comments
10. ticket_tags
11. ticket_tag_links
12. pages
13. page_blocks
14. attachments
15. share_links
16. audit_events

### Migration rules
- Prefer additive changes
- Do not rename/drop columns in early production without backup plan
- Seed only minimal development/test data
- Every migration must be reversible where practical

---

## 9. v1 Implementation Notes
- Store timestamps as ISO-8601 UTC text consistently
- Use generated IDs consistently across all entities
- Validate enum-like values in application layer and optionally with DB constraints where practical
- Keep page block content in JSON for flexibility
- Avoid premature normalization beyond current product scope

---

## 10. Questions to Resolve During Implementation
- Should internal staff accounts live in the same `users` table as customer accounts? Current recommendation: yes.
- Should saved ticket views be in v1 schema? Current recommendation: defer unless needed immediately.
- Should page comments be in v1? Current recommendation: defer to v1.5 unless strongly needed.
- Should sessions be fully app-managed or delegated partly to auth provider? Decide during auth architecture phase.
