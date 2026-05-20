# ObserveID Ticket Tracker — Build Plan

## 1. Purpose
Build a secure, modern, workspace-based customer issue tracker and communication portal for ObserveID.

Primary goals:
- replace the current Notion-based master/customer issue tracking workflow
- maintain one master issue record with many customer-facing views
- reduce copy/paste across Zoho Desk, Jira, internal notes, and customer updates
- support daily internal operations with strong visibility and low friction
- provide secure customer-safe workspaces and shareable links where policy allows
- create a strong foundation for phased AI assistance and automation later
- keep infrastructure Cloudflare-native and operationally simple
- support a small-user reliability target (up to ~25 active users) with enterprise-style engineering discipline

This document is the source of truth for human developers, CLI workflows, and coding agents for how the product should be built.

---

## 2. Product Definition
This is not just a ticket list.
This product is a customer issue operations platform with:
- workspaces
- master issues
- affected-customer visibility
- internal notes vs customer-visible updates
- rich-text pages
- table/database views
- attachments
- secure member access
- controlled share links
- audit logging
- future AI-assisted summarization and update drafting

### Core product objects
- Tenant
- Workspace
- Member
- Role
- MasterIssue
- AffectedCustomerLink
- SupportTicketReference
- EngineeringLink
- TicketUpdate
- InternalNote
- Comment
- Page
- Block
- Attachment
- ShareLink
- MeetingTranscript
- AIDraftSuggestion
- AuditEvent

---

## 3. Product Problem and Operating Model
ObserveID currently maintains customer issue communication through manual Notion pages and linked customer pages.
This creates duplication, lag, and poor visibility across systems.

The product should solve these problems:
- incoming support issues arrive in one system while engineering progress lives in another
- internal teams have to manually collect and restate updates
- one master issue often affects multiple customers
- customer-safe communication must remain separate from internal notes
- teams need to know current standing quickly without reading long documents

The target operating model is:
1. intake signal arrives from Zoho Desk, manual entry, or meeting notes
2. issue is linked to or created as a master issue
3. internal operators maintain a single source of truth
4. customer-facing views derive safe updates from that master issue
5. later, AI assists with summarization, draft generation, and issue linking

---

## 4. Constraints and Principles

### Constraints
- Max expected usage: ~25 users
- Must be secure and reliable
- Must be easy to operate daily
- Must be URL-accessible for approved customer users
- Must support role-based permissions
- Must avoid unnecessary infrastructure complexity
- Must use official Cloudflare platform components where possible
- Must not over-automate before manual workflows are proven

### Engineering principles
- simplicity over cleverness
- server-side authorization for every protected resource
- tenant isolation by design
- explicit schemas and strong typing
- minimal dependency surface
- every sensitive action auditable
- reversible access control actions where possible
- UX clarity over visual gimmicks
- one master issue model over duplicated customer records
- AI must support operator review, not bypass it

---

## 5. Recommended Stack

### Primary development environment
- VS Code
- local CLI workflow
- coding agent only for approved implementation tasks

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
- Hono
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
- Durable Objects: optional later if realtime or session coordination is ever justified

### Testing
- Vitest
- Playwright
- type checking in CI
- linting in CI

---

## 6. Why Not Xcode
Xcode is not the primary environment for this product.
This product is a secure web platform, not a native Apple-first app.
Use VS Code as the primary development environment.
If a native mobile app is needed later, it can be built after the web platform is stable.

---

## 7. Architecture Overview

### High-level architecture
1. React frontend for internal and customer UI
2. Cloudflare Worker API for business logic
3. D1 database for structured application data
4. R2 bucket for file attachments
5. Cloudflare Access for internal admin protection
6. app-level auth and RBAC for customer users
7. Turnstile on sign-in/invite/share entry points where appropriate
8. AI integration layer later for transcript and update assistance

### Deployment model
- single app with multi-tenant data model
- shared runtime, isolated data via tenant/workspace scoping
- separate environments: local, preview/staging, production

### Multi-tenancy model
- ObserveID operates the platform
- each customer is a tenant
- each tenant can have one or more workspaces
- members belong to a workspace with explicit roles
- master issues can relate to one or more customers/workspaces depending on final schema design

---

## 8. Identity, IAM, and Security Model

### Authentication
#### Internal staff
- protected by Cloudflare Access
- prefer company identity provider integration
- enforce MFA through identity provider where possible

#### Customer users
- app-level authentication
- support invite-based onboarding
- support simple secure sign-in model in MVP
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
- tickets.publish_customer_update
- pages.create
- pages.edit
- pages.share
- attachments.upload
- audit.view

### Security rules
- all authorization checks must happen server-side
- no cross-tenant data leakage
- internal notes must never be visible externally unless policy explicitly allows it
- all share links must be scoped and revocable
- sessions must be short-lived and securely stored
- secrets must only exist in Cloudflare-managed environment configuration
- AI outputs must never bypass visibility controls or publish automatically without review

### Share link controls
- scope to page, report, issue, or workspace-safe view
- expiration supported
- revocation supported
- optional password protection later if needed
- access logging required
- read-only mode by default

### Audit events
Log at minimum:
- login
- logout
- invite created
- invite accepted
- role changed
- issue created
- issue updated
- internal note created
- customer-visible update created
- attachment uploaded
- share link created
- share link revoked
- sensitive setting changed
- AI draft generated where security/audit value exists

---

## 9. Data Model Direction

### Core tables / resources
- tenants
- workspaces
- workspace_members
- roles
- permissions
- role_permissions
- users
- sessions
- master_issues
- issue_customer_links
- support_ticket_references
- engineering_links
- issue_updates
- internal_notes
- issue_comments
- pages
- page_blocks
- attachments
- share_links
- meeting_transcripts
- ai_draft_suggestions
- audit_events
- invites

### Suggested master issue fields
- id
- workspace_id or owning workspace reference as designed
- issue_number
- title
- normalized_summary
- description
- status
- priority
- severity
- category
- assignee_member_id
- due_date
- current_standing
- next_expected_update_at
- created_at
- updated_at
- archived_at

### Suggested customer link fields
- id
- issue_id
- workspace_id or customer reference
- impact_level
- customer_visible_status_override optional
- last_customer_update_at
- created_at

### Suggested issue update fields
- id
- issue_id
- author_member_id
- visibility (internal/customer)
- message
- created_at

### Suggested engineering link fields
- id
- issue_id
- provider
- external_key
- external_url
- status_snapshot optional
- synced_at optional

---

## 10. UX and Product Surface

### Primary internal navigation
- Overview
- Tickets
- Pages
- Files
- Members
- Share Links
- Settings

### Key product surfaces
1. workspace overview
2. master issue list
3. master issue detail
4. customer-safe issue communication view
5. pages/spaces
6. member management
7. share-link management
8. settings
9. later operational dashboard

### UX goals
- show current standing clearly
- make daily updating very fast
- keep customer UI simple and calm
- distinguish internal-only vs customer-visible content clearly
- keep navigation consistent
- reduce clicks for common workflows
- support a future operator cockpit for “what needs attention now”

### Design references
Borrow qualities from:
- Linear: clarity and issue flow
- Notion: page structure and context layering
- Stripe/Vercel: spacing and polish
- serious enterprise tools: trust, density, operational clarity

Do not copy visual design directly. Focus on clarity, speed, and trust.

---

## 11. Pages and “Notion-like” Spaces

### Scope for v1
Implement a practical subset of Notion-like functionality.

### v1 page capabilities
- nested pages in workspace sidebar
- rich text title and body
- basic blocks
- slash commands baseline later
- embedded issue views
- customer/account context pages

### Important scope note
Do not attempt to build a full Notion clone in v1.
Build pages + blocks + linked issue views only.

---

## 12. Master Issue System Requirements

### Required capabilities
- create issue
- edit issue
- assign issue
- add due date
- add internal note
- add customer-visible update
- attach files
- comment on issue
- filter and sort issues
- audit issue history
- link one issue to multiple affected customers where applicable

### Required statuses
- New
- Investigating
- Identified
- InProgress
- WaitingOnObserveID
- WaitingOnCustomer
- WaitingOnVendor
- Blocked
- Monitoring
- Resolved
- Closed

### Required priorities
- Low
- Medium
- High
- Urgent

### Required current-standing outputs
- concise standing label
- time since last update
- next expected update when available
- clear distinction between internal and customer-safe messaging

### Views
- table view (required)
- board view (deferred)
- calendar view (deferred)

---

## 13. Customer Communication Layer Requirements
The product must support one master issue being reflected into multiple customer-facing views safely.

### Required capabilities
- customer-safe issue visibility
- affected-customer linking
- customer-safe updates
- clear “current standing” summary
- last updated visibility
- shareable read-only views where approved

### Explicit safety rule
Internal notes and customer-visible updates must remain separate in the data model, API, and UI.

---

## 14. AI and Automation Direction
AI is not core MVP functionality, but it is a planned product advantage.

### Early AI use cases
- transcript to internal summary draft
- transcript to customer update draft
- issue-linking suggestion for repeated reports
- stale issue detection and update nudges
- customer-safe rewrite suggestions from internal context

### Guardrails
- AI outputs are suggestions, not automatic truth
- humans review before publishing
- AI must not weaken permission boundaries
- begin with narrow, high-value operator workflows

### MCP / tool integration direction
Possible future tool integrations include:
- Zoho Desk reader
- Jira reader
- transcript ingestion tool
- update drafting tool
- issue search/linking tool

Keep this phased and practical.

---

## 15. Reliability and Quality Requirements

### Non-functional targets
- fast initial page load for overview and issue list
- predictable API latency for normal operations
- safe rollback path for releases
- full auditability of sensitive mutations
- stable behavior under expected load (25 users)

### Testing requirements
#### Unit tests
- permission checks
- domain logic
- validation logic
- issue status transitions
- visibility separation rules

#### Integration tests
- auth/session flows
- workspace membership enforcement
- issue CRUD
- page CRUD
- share-link validation
- audit log creation

#### End-to-end tests
- admin sign-in
- create workspace
- invite member
- create issue
- add internal note
- add customer update
- customer views issue
- share link works/revokes correctly

---

## 16. Release, Approval, and Change Control

### Require explicit approval before
- adding a new dependency
- changing auth flows
- changing IAM design
- changing storage model
- destructive schema changes
- enabling public share access in production
- deployment to production
- introducing external-system sync that materially changes core flow

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

## 17. Coding Standards
- strict TypeScript enabled
- no unchecked any types
- all env vars validated at startup
- Zod schemas for request/response boundaries where appropriate
- shared domain types in common package/module
- small modules with explicit responsibilities
- prefer composition over inheritance
- prefer deterministic functions for business logic
- all protected routes require explicit auth middleware and permission checks

---

## 18. Dependency Policy
Use the minimum number of dependencies required.

### Preferred dependency categories
- framework/runtime-critical
- validation
- UI primitives
- testing
- editor
- data table

### Avoid
- experimental auth packages without strong maintenance
- bloated all-in-one admin templates
- overlapping state management libraries
- unnecessary realtime frameworks in v1

---

## 19. Local Development Workflow

### Expected tools
- Node.js LTS
- package manager (pnpm preferred)
- Wrangler
- VS Code

### Typical commands
- install dependencies
- start frontend dev server or preview server
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

## 20. Suggested Monorepo Layout

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
  PRODUCT_STRATEGY.md
  AI_AUTOMATION_PLAN.md
```

If implementation starts simpler, a reduced structure is acceptable, but keep boundaries clear.

---

## 21. Phased Delivery Plan

### Phase 0 — Architecture Lock
- finalize stack
- finalize IAM assumptions
- finalize data model direction
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
- routing and local preview
- logging scaffolding

### Phase 2 — Auth + Workspaces
- internal access model
- customer auth
- workspace creation/listing
- member invites
- role assignment
- permission middleware
- audit logs baseline

### Phase 3 — Master Issues
- issue schema
- issue CRUD
- internal notes
- customer updates
- attachments baseline
- affected-customer linking
- current standing fields

### Phase 4 — Customer Visibility
- customer-safe issue views
- workspace overview improvement
- customer summary surfaces
- share-safe visibility structure

### Phase 5 — Pages + Views
- page tree
- TipTap editor baseline
- slash commands baseline
- embedded issue views
- sidebar integration

### Phase 6 — Sharing
- share links
- expiry/revoke
- access logging
- read-only external views

### Phase 7 — Operational Visibility
- dashboard widgets
- stale issue views
- missing-update visibility
- operator cockpit baseline

### Phase 8 — AI Assist
- transcript ingestion
- summary drafts
- customer update drafts
- issue-linking suggestions

### Phase 9 — Integrations
- Zoho Desk reference/linking
- Jira reference/linking
- sync strategy baseline

### Phase 10 — Hardening
- full testing pass
- accessibility pass
- performance pass
- security review
- deployment docs
- rollback docs
- support runbook

---

## 22. Definition of Done
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

## 23. Immediate Next Implementation Tasks
1. finish auth/session baseline
2. finish permission and membership enforcement
3. connect web route-state to auth-aware behavior
4. build workspace overview with real data shape
5. build master issue list and detail flows
6. implement internal note vs customer update flows
7. build customer-safe issue visibility layer
8. add attachments baseline
9. add share-link baseline
10. add transcript/AI planning after manual issue workflows are stable

---

## 24. Agent Instructions
If a coding agent reads this file, it must follow these rules:
- do not add dependencies without approval
- do not change IAM model without approval
- do not assume public access is allowed
- keep implementation simple and explicit
- prefer official Cloudflare platform features
- use strict typing and validation
- build foundation first, then workflows, then visibility, then automation
- ask for approval before production-impacting changes

---

## 25. Final Recommendation
Build this as a secure Cloudflare-native web application in VS Code using TypeScript end-to-end.
Use chat for planning, agent for approved implementation, and CLI for local development and deployment.
Do not use Xcode as the primary development environment for this product.
