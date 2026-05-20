# ObserveID Ticket Tracker — Implementation Sequence

## 1. Purpose
This document defines the exact build order for the ObserveID Ticket Tracker.

All developers and coding agents should follow this sequence unless an explicit approval is given to change it.

The purpose is to avoid chaos, reduce rework, and ensure security and architecture foundations are built before feature layers.

This sequence has been revised to reflect the actual product problem more precisely:
- replace manual Notion-based master/customer issue tracking
- reduce copy/paste across Zoho, Jira, and customer communication surfaces
- preserve one master issue with many customer-facing views
- support gradual AI-assisted operations after manual workflows are stable

---

## 2. Implementation Rules
- do not build advanced features before foundations are stable
- do not add dependencies without checking `docs/DEPENDENCY_APPROVALS.md`
- do not change auth or IAM shape without approval
- do not implement public/share access before permission controls exist
- do not build realtime collaboration in MVP
- follow the documented architecture, schema, route definitions, and API contracts
- optimize for operational clarity over feature breadth
- prefer one master issue model over duplicated customer-specific issue records
- AI and automation should assist existing workflows, not replace core manual control too early

---

## 3. Phase 0 — Read and Confirm
Before writing code, read:
1. `README.md`
2. `docs/BUILD_PLAN.md`
3. `docs/MVP_SCOPE.md`
4. `docs/ARCHITECTURE.md`
5. `docs/PERMISSIONS_MATRIX.md`
6. `docs/DB_SCHEMA.md`
7. `docs/UI_UX_SYSTEM.md`
8. `docs/ROUTES_AND_SCREENS.md`
9. `docs/API_CONTRACTS.md`
10. `docs/DEPENDENCY_APPROVALS.md`
11. `docs/AGENT_INSTRUCTIONS.md`
12. `docs/OPEN_QUESTIONS.md`

---

## 4. Product Operating Model Reminder
The product is not just a ticket list.
It should become:
- a master issue system for internal operational truth
- a customer-safe communication layer
- a workspace-based portal for affected customers
- a future-ready platform for AI-assisted summarization, linking, and update drafting

Implementation decisions should support this operating model.

---

## 5. Phase 1 — Repository Foundation
Create the base project structure.

### Tasks
- set up repo structure
- set up monorepo or agreed project layout
- add package manager workspace config
- add base TypeScript configuration
- add lint configuration
- add formatting configuration
- add shared config package if needed
- add root scripts for typecheck, lint, test

### Deliverables
- working root project config
- consistent TypeScript rules
- consistent lint/format baseline

---

## 6. Phase 2 — Cloudflare and Environment Foundation
Prepare platform integration.

### Tasks
- create Cloudflare app/runtime configuration
- define environment variable strategy
- validate env variables at startup
- document local environment setup
- prepare D1 and R2 integration placeholders

### Deliverables
- environment config structure
- Cloudflare runtime config
- startup validation for config

---

## 7. Phase 3 — Shared Domain Foundations
Define shared types and domain contracts.

### Tasks
- create shared enums/constants for roles, permissions, statuses, priorities
- create shared domain types
- create validation schemas where appropriate
- centralize permission constants
- reflect the one-master-issue and customer-visibility model in shared contracts

### Deliverables
- reusable shared domain layer
- permission constants aligned to spec docs
- domain vocabulary aligned to product use case

---

## 8. Phase 4 — Database Foundation
Implement the initial schema.

### Tasks
- create schema definitions
- create initial migrations
- create DB access utilities
- add seed strategy for local development/test
- ensure schema supports one issue linked to many customers/workspaces where intended

### Deliverables
- initial migration set
- working local database setup
- schema aligned with `docs/DB_SCHEMA.md`

---

## 9. Phase 5 — Auth and Authorization Foundation
Build identity and access control before feature CRUD.

### Tasks
- implement auth/session baseline
- implement workspace membership resolution
- implement centralized permission-check utilities
- implement route guards/middleware
- implement invite model baseline
- implement audit event helper

### Deliverables
- authenticated request context
- permission enforcement helpers
- membership-aware route protection

---

## 10. Phase 6 — Application Shell and Routing Foundation
Build the UI shell before feature detail screens.

### Tasks
- create app shell layout
- create sidebar navigation
- create topbar/header
- create workspace selector flow baseline
- create shared UI primitives
- create loading/empty/error patterns
- implement lightweight route-state foundation for documented routes
- make apps/web previewable locally

### Deliverables
- navigable app shell
- reusable layout primitives
- baseline screen framework
- local preview path for product review

---

## 11. Phase 7 — Workspace and Membership Flows
Implement workspace-level operations.

### Tasks
- list accessible workspaces
- workspace overview page
- members list
- invite member flow
- role update flow
- member revoke/deactivate flow
- prepare customer workspace views to be safe and role-aware

### Deliverables
- working workspace management baseline
- auditable membership flows
- role-aware workspace structure

---

## 12. Phase 8 — Ticket System Core
Build the core product workflow.

### Tasks
- ticket list API
- ticket create/edit APIs
- ticket detail API
- ticket table UI
- ticket detail UI
- status/priority/assignee/due date controls
- internal note creation
- customer-visible update creation
- comments baseline
- link tickets/issues to affected customers where applicable
- ensure one master issue can support multiple customer-facing surfaces

### Deliverables
- usable ticket system
- customer-safe visibility separation
- daily update workflow support
- master issue baseline that can replace the current Notion workflow

---

## 13. Phase 9 — Customer Communication Layer
Make the product useful for customer visibility, not only internal tracking.

### Tasks
- build customer-safe issue views within workspaces
- support linked customer issue lists derived from master issues
- show current standing / status widgets for customer-friendly visibility
- add last-updated and next-expected-update fields where useful
- ensure internal notes never leak into customer-visible views

### Deliverables
- customer-facing issue communication baseline
- clear current-standing visibility
- safer replacement for linked Notion customer pages

---

## 14. Phase 10 — Attachments
Add safe file support.

### Tasks
- upload flow
- attachment metadata persistence
- attachment list rendering
- permission checks on access
- size/type validation

### Deliverables
- working attachment flow scoped to workspace/resources

---

## 15. Phase 11 — Pages / Spaces
Add the Notion-like workspace layer.

### Tasks
- page tree
- page create/edit/view
- TipTap baseline editor
- supported MVP blocks
- slash command baseline
- ticket-view block support
- support structured account/customer context pages without becoming a full Notion clone

### Deliverables
- usable page/documentation system
- pages integrated into workspace experience
- workspace context beyond raw tickets

---

## 16. Phase 12 — Share Links
Implement controlled external access.

### Tasks
- share link create flow
- share link revoke flow
- share link validation
- shared read-only route
- access logging
- support selective customer-safe visibility to issue or page content

### Deliverables
- safe read-only sharing baseline
- revocable and auditable shared access

---

## 17. Phase 13 — Operational Dashboard and Standing Widgets
Improve visibility for internal teams.

### Tasks
- add overview widgets for issue standing and urgency
- identify stale issues without recent updates
- identify customers awaiting communication
- identify issues missing linked engineering context
- surface “what needs attention now” operational views

### Deliverables
- internal operational cockpit baseline
- better prioritization and communication visibility

---

## 18. Phase 14 — AI Assist Foundation
Add tightly scoped AI help after manual workflows are stable.

### Tasks
- define transcript ingestion path
- support transcript-to-update draft generation
- support internal-summary vs customer-summary draft suggestions
- support issue-linking suggestions for repeated customer reports
- ensure all AI outputs are reviewable before publish

### Deliverables
- AI-assisted update drafting baseline
- transcript summarization support
- guarded AI workflow that improves, not obscures, operator control

---

## 19. Phase 15 — Integrations Baseline
Connect external systems only after core product flows exist.

### Tasks
- define Zoho Desk ingestion/sync strategy
- define Jira linking/sync strategy
- define import/link behavior for support tickets and engineering references
- keep integration flows observable and recoverable

### Deliverables
- practical integration baseline
- reduced manual copy/paste from source systems

---

## 20. Phase 16 — Auditability and Observability
Strengthen operational visibility.

### Tasks
- ensure key actions emit audit events
- create audit viewer if in MVP scope for internal roles
- centralize error logging approach
- document operational review points

### Deliverables
- visible action trail for sensitive operations

---

## 21. Phase 17 — Test Coverage
Add and expand automated testing.

### Tasks
- unit tests for auth/permission helpers
- integration tests for core APIs
- e2e tests for critical workflows
- permission denial tests
- share-link visibility tests
- AI draft safety tests where implemented

### Deliverables
- stable test baseline
- regression-ready workflow

---

## 22. Phase 18 — UX Polish and Hardening
Refine product quality.

### Tasks
- improve empty states
- improve loading states
- improve error handling
- accessibility pass
- responsive cleanup
- visual consistency pass
- improve clarity of current-standing and customer-safe communication surfaces

### Deliverables
- customer-usable, polished MVP experience

---

## 23. Phase 19 — Release Readiness
Prepare for first real deployment.

### Tasks
- review security checklist
- review test checklist
- review migration path
- verify rollback strategy
- run smoke tests
- finalize environment setup docs
- finalize release runbook

### Deliverables
- controlled MVP release candidate

---

## 24. Anti-Sequence Rules
Do not do these early:
- do not implement realtime collaboration before core CRUD is stable
- do not implement advanced charts before ticket and workspace UX is done
- do not add broad automation systems before manual flows are polished
- do not introduce heavy enterprise dependencies without clear need
- do not overbuild custom infra for a 25-user product
- do not let AI publish updates automatically before human review exists
- do not build deep third-party sync before the internal master issue model is stable

---

## 25. Definition of Sequence Success
Implementation sequencing is successful when:
- foundational layers are built first
- permission and data model mistakes are avoided early
- the MVP grows predictably without major rewrites
- each phase results in something stable and testable
- the product increasingly replaces the current Notion-based workflow with less manual duplication
