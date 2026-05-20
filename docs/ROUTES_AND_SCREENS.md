# ObserveID Ticket Tracker — Routes and Screens

## 1. Purpose
This document defines the baseline route structure and screen responsibilities for the ObserveID Ticket Tracker MVP.

It is intended to help developers and coding agents implement a consistent application shell and screen architecture without inventing the product shape ad hoc.

This document focuses on route and screen intent, not exact final UI layout.

---

## 2. Route Design Principles
- keep routes predictable and human-readable
- organize routes around workspace-scoped product areas
- preserve clear separation between customer-visible and internal-only actions
- favor simple route patterns over deeply nested complexity in MVP
- do not expose routes that imply unsupported MVP behavior

---

## 3. Top-Level App Areas
The app should support these primary areas where permissions allow:
- Overview
- Tickets
- Pages
- Files
- Members
- Share Links
- Settings

Navigation visibility may vary by role, but route protection must always be enforced server-side.

---

## 4. Workspace Context
The product is workspace-based.

Preferred route shape for authenticated application areas:

```text
/workspaces/:workspaceSlug/overview
/workspaces/:workspaceSlug/tickets
/workspaces/:workspaceSlug/pages
/workspaces/:workspaceSlug/files
/workspaces/:workspaceSlug/members
/workspaces/:workspaceSlug/share-links
/workspaces/:workspaceSlug/settings
```

This keeps workspace context explicit and reduces ambiguity.

---

## 5. Global / Non-Workspace Routes
These may exist outside the workspace-scoped structure:
- `/` → landing/redirect logic later
- `/login` → auth entry later
- `/accept-invite/:token` → invite acceptance later
- `/shared/:token` → controlled shared read-only view later
- `/not-authorized` → permission denial or access guidance later
- `/not-found` → generic missing page route later

These should remain minimal until auth/share phases are implemented.

---

## 6. Screen Inventory

### A. Workspace overview
Route:
- `/workspaces/:workspaceSlug/overview`

Purpose:
- orient the user within the workspace
- show high-value summary information
- provide quick links to tickets/pages/files

MVP expectations:
- workspace name/context
- a simple overview shell
- placeholder summary cards or panels later

---

### B. Ticket list
Route:
- `/workspaces/:workspaceSlug/tickets`

Purpose:
- show workspace-scoped tickets
- provide the primary operational ticket list experience

MVP expectations:
- table-based list using TanStack Table
- status, priority, assignee, due date, updated-at style columns
- filtering/sorting baseline later
- create ticket action where permitted

---

### C. Ticket detail
Route:
- `/workspaces/:workspaceSlug/tickets/:ticketId`

Purpose:
- show full ticket context
- separate internal notes from customer-visible updates
- support ticket metadata edits where permitted

MVP expectations:
- metadata header
- update/note sections
- comments/history baseline
- attachments section

---

### D. Pages list / root
Route:
- `/workspaces/:workspaceSlug/pages`

Purpose:
- entry point into workspace pages/spaces
- show page tree or page list depending on MVP shell stage

MVP expectations:
- page list/tree placeholder first
- create page action where permitted

### E. Page detail
Route:
- `/workspaces/:workspaceSlug/pages/:pageId`

Purpose:
- read or edit a page

MVP expectations:
- page title
- editor/read view shell
- TipTap integration later

---

### F. Files list
Route:
- `/workspaces/:workspaceSlug/files`

Purpose:
- list files/attachments available in a workspace context

MVP expectations:
- file list
- uploader entry point where permitted
- metadata and access-aware actions

---

### G. Members list
Route:
- `/workspaces/:workspaceSlug/members`

Purpose:
- manage workspace membership and roles

MVP expectations:
- member list
- invite member action
- role/status display
- revoke/deactivate action where permitted

---

### H. Share links list
Route:
- `/workspaces/:workspaceSlug/share-links`

Purpose:
- manage controlled share links

MVP expectations:
- share-link list
- create share-link action
- revoke action
- visibility/scope summary

---

### I. Settings
Route:
- `/workspaces/:workspaceSlug/settings`

Purpose:
- workspace-level configuration and administrative settings

MVP expectations:
- simple grouped settings shell first
- limited configuration sections based on permission

---

## 7. Route Priorities for MVP
Prioritize implementation in this order:
1. workspace overview
2. ticket list
3. ticket detail
4. members
5. share links
6. files
7. pages list/detail
8. settings

This order reflects product value and operational importance.

---

## 8. Placeholder Screen Requirements
Before real feature implementation, placeholder screens should still provide:
- clear screen title
- route-aware workspace context
- concise description of intended screen purpose
- visible placeholder actions only if clearly non-functional or intentionally stubbed

Do not create misleading fake functionality.

---

## 9. Navigation Requirements
Sidebar navigation should generally map to:
- Overview
- Tickets
- Pages
- Files
- Members
- Share Links
- Settings

Optional grouping:
- Workspace: Overview, Tickets, Pages, Files
- Collaboration / Access: Members, Share Links
- Administration: Settings

Navigation should highlight the current section clearly.

---

## 10. Ticket Sub-Screen Structure
For ticket detail, internal structure may later include:
- Overview tab or header summary
- Updates
- Internal Notes
- Attachments
- Activity

However, do not over-tab the MVP if a simpler single-column or two-column detail view is clearer.

---

## 11. Pages Structure Guidance
Pages may later support hierarchical navigation.

For MVP route planning:
- keep route access simple
- use `:pageId` for direct addressing
- avoid encoding full page tree paths in the URL initially

This keeps routing stable while page tree UX evolves.

---

## 12. Share Route Guidance
Shared external read-only access should use a distinct route:

```text
/shared/:token
```

Do not mix this with authenticated workspace routes.

This must feel like a controlled external surface, not a partial leak of the main app shell.

---

## 13. Permission and Access States
Any protected route should eventually support these outcomes:
- authorized render
- loading/auth resolution state
- not authorized state
- not found state where appropriate

The chosen user-facing behavior should be consistent across modules.

---

## 14. Future-Safe but Deferred Routes
Do not implement these in MVP unless required later:
- advanced dashboard analytics routes
- board/calendar ticket routes
- page comment-specific routes
- saved-view management routes
- customer SSO management routes

---

## 15. Definition of Route/Screen Success
The route and screen model is successful when:
- users can predict where to find key product areas
- workspace context is always clear
- core product areas map cleanly to navigation
- implementation can proceed incrementally without route churn
- the route structure remains simple and secure for MVP
