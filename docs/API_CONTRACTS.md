# ObserveID Ticket Tracker — API Contracts

## 1. Purpose
This document defines the baseline API contract expectations for the ObserveID Ticket Tracker MVP.

It is intended to guide backend and frontend implementation so route behavior, request/response shapes, permission boundaries, and error semantics stay consistent as features are built.

This document defines MVP contract direction, not a final wire-format freeze.

---

## 2. API Design Principles
- keep APIs resource-oriented and predictable
- keep workspace scoping explicit
- enforce permissions server-side on every protected route
- validate every mutation input
- return shapes that are stable and easy for frontend code to consume
- prefer explicit over clever response structures
- avoid exposing internal-only fields in customer-visible contexts

---

## 3. Transport and Runtime Context
The MVP backend runs on Cloudflare Workers using Hono.

Expected characteristics:
- JSON request/response for most authenticated APIs
- multipart/form-data only where file upload requires it
- typed validation using Zod
- persistence through D1 and file/blob storage through R2 where applicable

---

## 4. Authentication and Session Contract Direction
Auth implementation details are still open, but the API contract should assume:
- authenticated workspace APIs require a resolved user/session context
- protected routes return a consistent unauthorized response when no valid session exists
- protected routes return a consistent forbidden response when session exists but required permission is missing
- shared external routes use separate token-based access patterns from authenticated app routes

Until auth is finalized, handlers should preserve these contract expectations without hard-coding a specific auth vendor model.

---

## 5. General Response Envelope Guidance
For MVP, favor consistent JSON responses.

Recommended shape for success responses:

```json
{
  "data": {}
}
```

Recommended shape for errors:

```json
{
  "error": {
    "code": "string_code",
    "message": "Human-readable summary"
  }
}
```

Optional metadata may be included when useful:

```json
{
  "data": {},
  "meta": {}
}
```

Do not overuse envelopes if a route becomes cleaner with a direct resource object, but maintain consistency within a resource area.

---

## 6. Common Error Semantics
The API should use consistent error categories.

### Unauthorized
Meaning:
- no valid session

Suggested HTTP status:
- `401`

Suggested error code:
- `unauthorized`

### Forbidden
Meaning:
- valid session exists, but permission or membership is insufficient

Suggested HTTP status:
- `403`

Suggested error code:
- `forbidden`

### Not found
Meaning:
- resource does not exist, or intentionally hidden under the chosen access model

Suggested HTTP status:
- `404`

Suggested error code:
- `not_found`

### Validation error
Meaning:
- input failed schema validation

Suggested HTTP status:
- `400`

Suggested error code:
- `validation_error`

### Conflict
Meaning:
- duplicate or invalid state transition for requested operation

Suggested HTTP status:
- `409`

Suggested error code:
- `conflict`

### Internal error
Meaning:
- unexpected server failure

Suggested HTTP status:
- `500`

Suggested error code:
- `internal_error`

---

## 7. Authenticated API Route Shape
Prefer versionable, application-oriented route prefixes.

Suggested MVP authenticated API prefix:

```text
/api/v1
```

Workspace-scoped resources should keep workspace identity explicit.

Preferred shape:

```text
/api/v1/workspaces/:workspaceSlug/...
```

---

## 8. Session and Current User Routes

### Get current session
Route:
- `GET /api/v1/session`

Purpose:
- resolve current authenticated user/session state
- support web shell bootstrapping later

Suggested response shape:

```json
{
  "data": {
    "authenticated": true,
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "displayName": "Jane Doe",
      "userType": "internal"
    }
  }
}
```

If unauthenticated:

```json
{
  "data": {
    "authenticated": false,
    "user": null
  }
}
```

### Get accessible workspaces
Route:
- `GET /api/v1/workspaces`

Purpose:
- list workspaces visible to the authenticated user

Suggested response fields:
- workspace id
- slug
- name
- membership role summary
- member status summary if applicable

---

## 9. Workspace Overview Routes

### Get workspace overview
Route:
- `GET /api/v1/workspaces/:workspaceSlug/overview`

Purpose:
- retrieve lightweight summary data for overview screen

Suggested MVP response areas:
- workspace metadata
- summary counts or recent highlights later
- no heavy analytics requirement in MVP

---

## 10. Ticket Routes

### List tickets
Route:
- `GET /api/v1/workspaces/:workspaceSlug/tickets`

Purpose:
- fetch workspace-scoped ticket list

Suggested query params later:
- `status`
- `priority`
- `assigneeId`
- `q`
- `cursor`
- `limit`
- `sort`

Suggested response item shape:
- id
- key or display identifier later if used
- title
- status
- priority
- assignee summary
- due date
- updated at
- visibility summary as needed

### Create ticket
Route:
- `POST /api/v1/workspaces/:workspaceSlug/tickets`

Purpose:
- create a new ticket

Minimum input direction:
- title
- description/body optional
- status optional default
- priority optional default
- assignee optional
- dueDate optional

### Get ticket detail
Route:
- `GET /api/v1/workspaces/:workspaceSlug/tickets/:ticketId`

Purpose:
- retrieve full ticket detail within workspace context

Suggested response areas:
- ticket metadata
- customer-visible updates
- internal notes separated
- comments/activity baseline
- attachments summary

### Update ticket
Route:
- `PATCH /api/v1/workspaces/:workspaceSlug/tickets/:ticketId`

Purpose:
- update editable ticket fields

### Add customer-visible update
Route:
- `POST /api/v1/workspaces/:workspaceSlug/tickets/:ticketId/updates`

Purpose:
- append customer-visible update entry

### Add internal note
Route:
- `POST /api/v1/workspaces/:workspaceSlug/tickets/:ticketId/internal-notes`

Purpose:
- append internal-only note entry

This separation is important and should remain explicit in route naming and handlers.

---

## 11. Ticket Comment and Attachment Direction
These may be implemented as sub-resources later.

Possible route direction:
- `GET /api/v1/workspaces/:workspaceSlug/tickets/:ticketId/comments`
- `POST /api/v1/workspaces/:workspaceSlug/tickets/:ticketId/comments`
- `POST /api/v1/workspaces/:workspaceSlug/tickets/:ticketId/attachments`
- `GET /api/v1/workspaces/:workspaceSlug/tickets/:ticketId/attachments`

Keep attachment access permission-aware.

---

## 12. Page Routes

### List pages or page root
Route:
- `GET /api/v1/workspaces/:workspaceSlug/pages`

### Create page
Route:
- `POST /api/v1/workspaces/:workspaceSlug/pages`

### Get page detail
Route:
- `GET /api/v1/workspaces/:workspaceSlug/pages/:pageId`

### Update page
Route:
- `PATCH /api/v1/workspaces/:workspaceSlug/pages/:pageId`

### List page children later if needed
Possible route:
- `GET /api/v1/workspaces/:workspaceSlug/pages/:pageId/children`

Page responses must respect page visibility rules.

---

## 13. File Routes

### List files
Route:
- `GET /api/v1/workspaces/:workspaceSlug/files`

### Upload file
Route:
- `POST /api/v1/workspaces/:workspaceSlug/files`

### Get file metadata
Route:
- `GET /api/v1/workspaces/:workspaceSlug/files/:fileId`

### Download/access file
Route direction:
- either proxied through controlled API route
- or short-lived signed access strategy later

Exact download strategy can be finalized during file implementation.

---

## 14. Member and Invite Routes

### List members
Route:
- `GET /api/v1/workspaces/:workspaceSlug/members`

### Invite member
Route:
- `POST /api/v1/workspaces/:workspaceSlug/members/invites`

### Update member role/status
Route:
- `PATCH /api/v1/workspaces/:workspaceSlug/members/:memberId`

### Revoke/deactivate member
Route direction:
- `POST /api/v1/workspaces/:workspaceSlug/members/:memberId/revoke`
- or `PATCH` using explicit status change

Choose one style and keep it consistent.

---

## 15. Share Link Routes

### List share links
Route:
- `GET /api/v1/workspaces/:workspaceSlug/share-links`

### Create share link
Route:
- `POST /api/v1/workspaces/:workspaceSlug/share-links`

### Revoke share link
Route:
- `POST /api/v1/workspaces/:workspaceSlug/share-links/:shareLinkId/revoke`

### Shared external access
Route:
- `GET /shared/:token`

Shared access should be read-only and contractually separated from authenticated app APIs.

---

## 16. Settings Routes
Settings APIs should remain small and permission-gated in MVP.

Possible route direction:
- `GET /api/v1/workspaces/:workspaceSlug/settings`
- `PATCH /api/v1/workspaces/:workspaceSlug/settings`

Do not overbuild settings surface area early.

---

## 17. Pagination and Filtering Guidance
For list endpoints, prefer a small, predictable approach.

MVP direction:
- allow simple `limit` and `cursor` pagination for APIs that need it
- support explicit filter params only where useful
- do not invent a complex query language in MVP

Suggested meta shape when paginating:

```json
{
  "data": [],
  "meta": {
    "nextCursor": "cursor_value"
  }
}
```

---

## 18. Audit and Safety Expectations
Sensitive mutations should eventually generate audit events, especially for:
- membership changes
- share-link creation/revocation
- permission-sensitive settings changes
- ticket visibility-sensitive actions where applicable

Audit emission may be implementation-phase work, but the contract should assume these actions are security-relevant.

---

## 19. Contract Anti-Patterns to Avoid
- mixing internal notes and customer-visible updates in one ambiguous mutation route
- hiding workspace context in implicit session-only resource routing
- leaking internal-only fields in customer-safe responses
- inconsistent error shapes across modules
- overbuilding GraphQL-like flexibility into MVP REST routes
- deep nesting that adds complexity without clear product value

---

## 20. Definition of API Contract Success
The API contract model is successful when:
- frontend teams can predict route and payload behavior
- permission boundaries remain explicit
- internal vs external visibility is preserved safely
- resource routes stay simple and consistent
- MVP features can be implemented incrementally without large contract rewrites
