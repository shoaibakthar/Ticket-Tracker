# ObserveID Ticket Tracker — Build Plan

## 1. Purpose
Build a secure, modern, workspace-based customer ticket tracker for ObserveID.

Primary goals:
- Customer workspace per client
- Named members with strict access control
- Daily ticket updates
- Secure shareable URLs where policy allows
- Rich pages/spaces for notes and status communication
- Modern, user-friendly UX
- Strong Cloudflare-native infrastructure
- Small-user reliability target (up to ~25 active users) with enterprise-style engineering discipline

This document is the source of truth for human developers, CLI workflows, and coding agents.

---

## 2. Product Definition
This is not just a ticket list.
This product is a multi-tenant customer operations portal with:
- Workspaces
- Tickets
- Rich-text pages
- Table/database views
- Comments and updates
- Attachments
- Secure member access
- Controlled share links
- Audit logging

### Core product objects
- Tenant
- Workspace
- Member
- Role
- Ticket
- TicketUpdate
- Comment
- Page
- Block
- Attachment
- ShareLink
- AuditEvent

---

## 3. Constraints and Principles

### Constraints
- Max expected usage: ~25 users
- Must be secure and reliable
- Must be easy to operate daily
- Must be URL-accessible for approved customer users
- Must support role-based permissions
- Must avoid unnecessary infrastructure complexity
- Must use official Cloudflare platform components where possible

### Engineering principles
- Simplicity over cleverness
- Server-side authorization for every protected resource
- Tenant isolation by design
- Explicit schemas and strong typing
- Minimal dependency surface
- Every sensitive action auditable
- Reversible access control actions where possible
- UX clarity over visual gimmicks

---

## 4. Recommended Stack

### Primary development environment
- VS Code
- Local CLI workflow
- Coding agent only for approved implementation tasks

### Frontend
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table
- TipTap
- TanStack Query

### Backend
- Cloudflare Workers
- TypeScript
- Hono (preferred lightweight routing layer)
- Zod for validation
- Drizzle ORM
- D1 for relational data
- R2 for attachments

### Cloudflare services
- Workers: API runtime
- Pages or static asset delivery via Workers: frontend hosting
- D1: relational data
- R2: attachments
- Turnstile: abuse protection
- Access: internal/admin protection
- Durable Objects: optional later for realtime collaboration

### Testing
- Vitest
- Playwright
- Type checking in CI
- Linting in CI

---

## 5. Why Not Xcode
Xcode is not the primary environment for this product.
This product is a secure web platform, not a native Apple-first app.
Use VS Code as the primary development environment.
If a native mobile app is needed later, it can be built after the web platform is stable.

---

## 6. Architecture Overview

### High-level architecture
1. React frontend for admin and customer UI
2. Cloudflare Worker API for business logic
3. D1 database for structured application data
4. R2 bucket for file attachments
5. Cloudflare Access for internal admin protection
6. App-level auth and RBAC for customer users
7. Turnstile on sign-in/invite/share entry points

### Deployment model
- Single app with multi-tenant data model
- Shared runtime, isolated data via tenant/workspace scoping
- Separate environments: local, preview/staging, production

### Multi-tenancy model
- ObserveID operates the platform
- Each customer is a tenant
- Each tenant can have one or more workspaces
- Members belong to a workspace with explicit roles

---

## 7. Identity, IAM, and Security Model

### Authentication
#### Internal staff
- Protected by Cloudflare Access
- Prefer company identity provider integration
- Enforce MFA through identity provider where possible

#### Customer users
- App-level authentication
- Support invite-based onboarding
- Support passwordless or email-based verification initially
- MFA-ready design for future enhancement

### Authorization
Use RBAC with explicit permission checks.

#### Platform roles
- PlatformSuperAdmin
- PlatformAdmin
- SupportOperator
- Auditor

#### Workspace roles
- WorkspaceOwner
- WorkspaceAdmin
- Member
- Viewer
- Guest

#### Permission examples
- workspace.view
- workspace.edit
- workspace.members.manage
- tickets.create
- tickets.update
- tickets.assign
- tickets.comment
- tickets.view_internal_notes
- pages.create
- pages.edit
- pages.share
- attachments.upload
- audit.view

### Security rules
- All authorization checks must happen server-side
- No cross-tenant data leakage
- Internal notes must never be visible externally unless policy explicitly allows it
- All share links must be scoped and revocable
- Sessions must be short-lived and securely stored
- Secrets must only exist in Cloudflare-managed environment configuration

### Share link controls
- Scope to page, report, ticket, or workspace view
- Expiration supported
- Revocation supported
- Optional password protection
- Access logging required
- Read-only mode by default

### Audit events
Log at minimum:
- login
- logout
- invite created
- invite accepted
- role changed
- ticket created
- ticket updated
- internal note created
- customer-visible update created
- attachment uploaded
- share link created
- share link revoked
- sensitive setting changed

---

## 8. Data Model

### Core tables
- tenants
- workspaces
- workspace_members
- roles
- permissions
- role_permissions
- tickets
- ticket_updates
- ticket_comments
- pages
- page_blocks
- attachments
- share_links
- audit_events
- invites
- sessions

### Suggested ticket fields
- id
- workspace_id
- ticket_number
- title
- description
- status
- priority
- severity
- category
- assignee_member_id
- reporter_name
- due_date
- sla_target_at
- created_at
- updated_at
- visibility
- archived_at

### Suggested ticket update fields
- id
- ticket_id
- author_member_id
- visibility (internal/customer)
- message
- created_at

### Suggested page fields
- id
- workspace_id
- parent_page_id
- title
- slug
- icon
- cover_image
- created_by
- created_at
- updated_at
- is_archived

### Suggested share link fields
- id
- workspace_id
- resource_type
- resource_id
- token_hash
- permission_scope
- expires_at
- revoked_at
- created_by
- created_at

---

## 9. UX and Product Surface

### Primary navigation
#### Admin/internal
- Dashboard
- Workspaces
- Tickets
- Pages
- Files
- Activity
- Members
- Settings
- Audit Logs

#### Customer
- Overview
- Tickets
- Updates
- Pages
- Files
- Team
- Profile

### Key screens
1. Sign in
2. Workspace selector
3. Workspace overview dashboard
4. Ticket list view
5. Ticket detail page/drawer
6. Page editor/viewer
7. Members management
8. Share links management
9. Settings
10. Audit log viewer

### UX goals
- Show latest status clearly
- Make daily ticket updating very fast
- Keep customer UI simple and calm
- Distinguish internal-only vs customer-visible content clearly
- Keep navigation consistent
- Reduce clicks for common workflows
- Support keyboard-first internal usage over time

### Design references
Borrow qualities from:
- Linear: clarity and task flow
- Notion: page structure and content composition
- Stripe/Vercel: spacing and polish
- Palantir-style enterprise seriousness: trust, density, operational clarity

Do not blindly copy visual design. Focus on clarity, speed, and trust.

---

## 10. Pages and “Notion-like” Spaces

### Scope for v1
Implement a practical subset of Notion-like functionality.

### v1 page capabilities
- Nested pages in workspace sidebar
- Rich text title and body
- Basic blocks
- Slash commands
- Embedded ticket views
- Comments on pages (optional in v1.5)

### Block types
- Heading
- Paragraph
- Bullet list
- Checklist
- Divider
- Callout
- Quote
- Simple table
- Ticket database view
- Attachment block
- Status summary block

### Slash commands
- /text
- /h1
- /h2
- /todo
- /divider
- /callout
- /table
- /ticket-view
- /files
- /summary

### Important scope note
Do not attempt to build a full Notion clone in v1.
Build pages + blocks + linked ticket views only.

---

## 11. Ticket System Requirements

### Required capabilities
- Create ticket
- Edit ticket
- Assign ticket
- Add due date
- Add internal note
- Add customer-visible update
- Attach files
- Comment on ticket
- Filter and sort tickets
- Save ticket views
- Audit ticket history

### Required statuses
- New
- Open
- InProgress
- WaitingOnObserveID
- WaitingOnCustomer
- Blocked
- Resolved
- Closed

### Required priorities
- Low
- Medium
- High
- Urgent

### Required filters
- status
- priority
- assignee
- due date
- updated date
- created date
- tag/category

### Views
- Table view (required)
- Board view (optional phase 2)
- Calendar view (optional phase 2)

---

## 12. File and Attachment Rules
- Store files in R2
- Store metadata in D1
- Restrict allowed file types initially
- Enforce size limits
- Virus scanning strategy should be documented if attachments become common
- Generate signed access patterns where needed
- Never expose raw storage structure directly

---

## 13. Reliability and Quality Requirements

### Non-functional targets
- Fast initial page load for dashboard and ticket list
- Predictable API latency for normal operations
- Safe rollback path for releases
- Full auditability of sensitive mutations
- Stable behavior under expected load (25 users)

### Testing requirements
#### Unit tests
- permission checks
- domain logic
- validation logic
- ticket status transitions

#### Integration tests
- auth/session flows
- workspace membership enforcement
- ticket CRUD
- page CRUD
- share link validation
- audit log creation

#### End-to-end tests
- admin sign-in
- create workspace
- invite member
- create ticket
- add update
- customer views ticket
- share link works/revokes correctly

### Regression requirements
- Any bug fixed must get a regression test where practical

---

## 14. Release, Approval, and Change Control

### Require explicit approval before
- adding a new dependency
- changing auth flows
- changing IAM design
- changing storage model
- destructive schema changes
- enabling public share access in production
- deployment to production

### No approval required for
- tests
- documentation updates
- non-breaking refactors
- local development tooling adjustments that do not affect runtime architecture

### Release flow
1. feature branch
2. local verification
3. preview deployment
4. review and approval
5. production deployment
6. post-deploy smoke test

### Rollback requirement
Every production deployment must have a rollback plan.

---

## 15. Coding Standards
- Strict TypeScript enabled
- No unchecked any types
- All env vars validated at startup
- Zod schemas for request/response boundaries where appropriate
- Shared domain types in common package/module
- Small modules with explicit responsibilities
- Prefer composition over inheritance
- Prefer deterministic functions for business logic
- All protected routes require explicit auth middleware and permission checks

---

## 16. Dependency Policy
Use the minimum number of dependencies required.

### Preferred dependency categories
- Framework/runtime-critical
- Validation
- UI primitives
- Testing
- Editor
- Data table

### Avoid
- experimental auth packages without strong maintenance
- bloated all-in-one admin templates
- overlapping state management libraries
- unnecessary realtime frameworks in v1

---

## 17. Local Development Workflow

### Expected tools
- Node.js LTS
- package manager (pnpm preferred)
- Wrangler
- VS Code

### Typical commands
- install dependencies
- start frontend dev server
- start worker dev server
- run typecheck
- run lint
- run tests
- run e2e
- apply migrations
- seed development data

### Local environment requirements
- .dev.vars or equivalent local secret config
- local D1 workflow documented
- local R2 emulation or dev strategy documented

---

## 18. Suggested Monorepo Layout

```text
apps/
  web/
  api/
packages/
  ui/
  db/
  auth/
  types/
  config/
docs/
  BUILD_PLAN.md
  architecture/
  security/
```

If implementation starts simpler, a reduced structure is acceptable, but keep boundaries clear.

---

## 19. Phased Delivery Plan

### Phase 0 — Architecture Lock
- finalize stack
- finalize IAM
- finalize data model
- finalize navigation
- finalize dependency list
- finalize design principles

### Phase 1 — Foundation
- repo structure
- TypeScript setup
- lint/format/test setup
- Cloudflare config
- env validation
- base UI shell
- logging scaffolding

### Phase 2 — Auth + Workspaces
- internal access model
- customer auth
- workspace creation
- member invites
- role assignment
- permission middleware
- audit logs baseline

### Phase 3 — Tickets
- ticket schema
- ticket CRUD
- updates
- comments
- assignees
- due dates
- attachments
- internal vs external visibility

### Phase 4 — Pages + Views
- page tree
- TipTap editor baseline
- slash commands
- embedded ticket views
- sidebar navigation

### Phase 5 — Sharing
- share links
- expiry/revoke
- access logging
- read-only/report views

### Phase 6 — Hardening
- full testing pass
- accessibility pass
- performance pass
- security review
- deployment docs
- rollback docs
- support runbook

---

## 20. Definition of Done
A feature is not done until:
- business requirements are implemented
- permission checks are enforced server-side
- validation exists
- tests exist at appropriate level
- audit events are emitted for sensitive actions
- error states are handled
- UI is usable and consistent
- documentation is updated if behavior changes

---

## 21. Immediate Next Implementation Tasks
1. Confirm monorepo vs single-app layout
2. Initialize Cloudflare-based app structure
3. Define D1 schema and migrations
4. Define auth/session approach
5. Define permission matrix
6. Build app shell and routing
7. Build workspace + membership flows
8. Build ticket CRUD and updates
9. Build page editor baseline
10. Add tests before production deployment

---

## 22. Agent Instructions
If a coding agent reads this file, it must follow these rules:
- Do not add dependencies without approval
- Do not change IAM model without approval
- Do not assume public access is allowed
- Keep implementation simple and explicit
- Prefer official Cloudflare platform features
- Use strict typing and validation
- Build foundation first, then features, then hardening
- Ask for approval before production-impacting changes

---

## 23. Final Recommendation
Build this as a secure Cloudflare-native web application in VS Code using TypeScript end-to-end.
Use chat for planning, agent for approved implementation, and CLI for local development and deployment.
Do not use Xcode as the primary development environment for this product.
