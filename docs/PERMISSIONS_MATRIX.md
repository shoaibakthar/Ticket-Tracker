# ObserveID Ticket Tracker — Permissions Matrix

## 1. Purpose
This document defines the authorization model for the ObserveID Ticket Tracker.
It complements `docs/BUILD_PLAN.md` and should be treated as the source of truth for server-side permission enforcement.

Authorization must always be enforced on the server.
Frontend visibility rules are not security controls.

---

## 2. Scope Model

Permissions are evaluated across these scopes:
- Platform
- Tenant
- Workspace
- Resource
- Field-level visibility where required

### Scope hierarchy
1. Platform
2. Tenant
3. Workspace
4. Resource
5. Field / action visibility

---

## 3. Actor Types

### Internal ObserveID actors
- PlatformSuperAdmin
- PlatformAdmin
- SupportOperator
- Auditor

### Customer actors
- WorkspaceOwner
- WorkspaceAdmin
- Member
- Viewer
- Guest

### Non-member access
- ShareLinkViewer

---

## 4. Core Permission Rules

### Global rules
- No actor may access another tenant's data unless they are an internal ObserveID role with explicit support scope.
- Customer actors are always restricted to their own workspace memberships.
- Internal notes are never visible to customer-facing actors unless explicitly marked customer-visible.
- Share links are read-only by default.
- Share links must never expose internal notes, audit logs, or member management actions.
- All privileged actions must emit audit events.

### Server-side enforcement requirements
The API must validate all of the following before allowing access:
- authenticated identity (or valid share token for limited routes)
- workspace membership or internal support scope
- role capability
- resource ownership / tenant relation
- visibility level for the requested content

---

## 5. Permission Catalog

### Workspace permissions
- workspace.view
- workspace.edit
- workspace.archive
- workspace.members.view
- workspace.members.manage
- workspace.settings.view
- workspace.settings.manage

### Ticket permissions
- tickets.view
- tickets.create
- tickets.update
- tickets.delete
- tickets.assign
- tickets.comment
- tickets.attach
- tickets.view_internal_notes
- tickets.create_internal_notes
- tickets.create_customer_updates
- tickets.change_status
- tickets.manage_views

### Page permissions
- pages.view
- pages.create
- pages.update
- pages.delete
- pages.share
- pages.comment

### Attachment permissions
- attachments.view
- attachments.upload
- attachments.delete

### Share link permissions
- shares.create
- shares.view
- shares.revoke

### Audit permissions
- audit.view

### Tenant/admin permissions
- tenant.view
- tenant.manage
- support.cross_workspace_access

---

## 6. Role-to-Permission Matrix

## PlatformSuperAdmin
Full platform authority.

Allowed:
- all workspace permissions
- all ticket permissions
- all page permissions
- all attachment permissions
- all share permissions
- audit.view
- tenant.view
- tenant.manage
- support.cross_workspace_access

Denied:
- none by default, except actions intentionally restricted by implementation safety rules

---

## PlatformAdmin
Administrative internal role with broad operational scope.

Allowed:
- workspace.view
- workspace.edit
- workspace.members.view
- workspace.members.manage
- workspace.settings.view
- workspace.settings.manage
- all ticket permissions
- all page permissions
- all attachment permissions
- all share permissions
- audit.view
- tenant.view
- tenant.manage
- support.cross_workspace_access

Denied:
- platform-level destructive actions reserved for PlatformSuperAdmin if implemented later

---

## SupportOperator
Internal operational role for day-to-day ticket support.

Allowed:
- workspace.view
- workspace.members.view
- workspace.settings.view
- tickets.view
- tickets.create
- tickets.update
- tickets.assign
- tickets.comment
- tickets.attach
- tickets.view_internal_notes
- tickets.create_internal_notes
- tickets.create_customer_updates
- tickets.change_status
- tickets.manage_views
- pages.view
- pages.create
- pages.update
- pages.comment
- attachments.view
- attachments.upload
- shares.create
- shares.view
- audit.view
- tenant.view
- support.cross_workspace_access

Denied:
- workspace.members.manage
- workspace.settings.manage
- shares.revoke unless explicitly elevated
- tenant.manage
- unrestricted destructive operations by default

---

## Auditor
Read-heavy internal role.

Allowed:
- workspace.view
- workspace.members.view
- workspace.settings.view
- tickets.view
- tickets.comment
- tickets.view_internal_notes
- pages.view
- attachments.view
- shares.view
- audit.view
- tenant.view
- support.cross_workspace_access

Denied:
- create/update/delete actions
- member management
- share creation/revocation
- settings changes

---

## WorkspaceOwner
Highest customer-facing role within a workspace.

Allowed:
- workspace.view
- workspace.edit
- workspace.members.view
- workspace.members.manage
- workspace.settings.view
- workspace.settings.manage
- tickets.view
- tickets.create
- tickets.update
- tickets.assign
- tickets.comment
- tickets.attach
- tickets.create_customer_updates
- tickets.change_status
- tickets.manage_views
- pages.view
- pages.create
- pages.update
- pages.delete
- pages.share
- pages.comment
- attachments.view
- attachments.upload
- attachments.delete
- shares.create
- shares.view
- shares.revoke

Denied:
- tickets.view_internal_notes
- tickets.create_internal_notes
- audit.view unless a customer-safe audit view is explicitly designed
- tenant.manage
- support.cross_workspace_access

---

## WorkspaceAdmin
Strong customer admin role with operational control.

Allowed:
- workspace.view
- workspace.edit
- workspace.members.view
- workspace.members.manage
- workspace.settings.view
- tickets.view
- tickets.create
- tickets.update
- tickets.assign
- tickets.comment
- tickets.attach
- tickets.create_customer_updates
- tickets.change_status
- tickets.manage_views
- pages.view
- pages.create
- pages.update
- pages.share
- pages.comment
- attachments.view
- attachments.upload
- shares.create
- shares.view
- shares.revoke

Denied:
- tickets.view_internal_notes
- tickets.create_internal_notes
- workspace.settings.manage unless explicitly enabled
- pages.delete by default unless elevated
- audit.view
- tenant.manage
- support.cross_workspace_access

---

## Member
Standard customer workspace user.

Allowed:
- workspace.view
- workspace.members.view
- tickets.view
- tickets.comment
- tickets.attach
- pages.view
- pages.comment
- attachments.view

Optional by policy:
- tickets.create
- tickets.update
- pages.create
- pages.update

Denied by default:
- workspace.members.manage
- workspace.settings.view
- workspace.settings.manage
- tickets.assign
- tickets.view_internal_notes
- tickets.create_internal_notes
- tickets.change_status unless policy allows
- tickets.manage_views unless policy allows
- pages.share
- attachments.delete
- shares.create
- shares.revoke
- audit.view

---

## Viewer
Read-only customer role.

Allowed:
- workspace.view
- workspace.members.view
- tickets.view
- pages.view
- attachments.view

Denied:
- create/update/delete actions
- comments unless explicitly enabled
- uploads
- sharing
- settings
- internal notes
- audit access

---

## Guest
Restricted customer/external user with narrow workspace access.

Allowed:
- workspace.view (limited surface)
- tickets.view (only explicitly exposed tickets/views)
- pages.view (only explicitly exposed pages)
- attachments.view (only files attached to visible resources if allowed)

Denied:
- all management actions
- member views by default
- comments unless explicitly enabled
- any internal notes
- settings
- share creation
- audit access

---

## ShareLinkViewer
Unauthenticated or semi-authenticated access using a tokenized share link.

Allowed:
- view only the specific shared resource
- access only within link scope and expiry window
- optionally comment only if a future policy explicitly enables it

Denied:
- workspace navigation outside shared scope
- internal notes
- audit logs
- settings
- member lists by default
- any create/update/delete action unless explicitly designed later

---

## 7. Resource Visibility Rules

### Ticket visibility types
- internal_only
- customer_visible
- restricted_customer_visible

### Ticket update visibility
- internal
- customer

Rules:
- Internal roles may see both internal and customer-visible updates where scoped.
- Customer roles may only see customer-visible updates.
- ShareLinkViewer may only see customer-visible updates on shared resources.

### Page visibility types
- internal_only
- workspace_members
- restricted_members
- shared_link

### Attachment visibility
Attachments inherit the visibility of the resource they belong to unless a stricter rule is applied.

---

## 8. Special Access Policies

### Cross-workspace support access
Only internal roles with `support.cross_workspace_access` may access multiple customer workspaces.
Such access must be auditable.

### Break-glass access
If emergency access is later implemented:
- it must be time-bound
- require explicit justification
- generate high-priority audit events
- be limited to senior internal roles

### Sensitive actions requiring confirmation
Recommended for UI and API workflow:
- revoke share link
- remove workspace owner
- bulk close tickets
- change workspace settings
- destructive deletes if ever enabled

---

## 9. Default Permission Presets

### Recommended customer defaults
#### WorkspaceOwner
Full customer control except internal-only platform/admin data.

#### WorkspaceAdmin
Can operate workspace daily but cannot access internal notes.

#### Member
Read/comment participation, limited creation by policy.

#### Viewer
Read-only access.

#### Guest
Narrow read-only access to explicitly exposed resources.

---

## 10. API Enforcement Checklist
Every protected endpoint should enforce:
1. identity resolution
2. session validity
3. workspace scope resolution
4. permission check
5. resource-visibility check
6. audit logging for privileged actions

Examples:
- `GET /api/workspaces/:id/tickets` => require workspace.view + tickets.view
- `POST /api/workspaces/:id/tickets/:ticketId/internal-notes` => require tickets.create_internal_notes
- `POST /api/workspaces/:id/share-links` => require shares.create
- `GET /s/:token` => validate token scope, expiry, revocation, and resource visibility

---

## 11. Implementation Notes
- Use centralized authorization utilities
- Avoid inline ad hoc permission logic scattered across handlers
- Prefer explicit permission constants
- Model role grants in code and optionally in DB for future flexibility
- Add permission tests for every sensitive route

---

## 12. Definition of Done for Authorization
Authorization is not complete until:
- permission model is implemented server-side
- route coverage exists for protected endpoints
- cross-tenant access tests exist
- internal note visibility tests exist
- share-link scope tests exist
- audit events are emitted for privileged actions
