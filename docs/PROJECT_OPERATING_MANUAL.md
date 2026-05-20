# ObserveID Ticket Tracker — Project Operating Manual

## 1. Purpose
This is the master operational document for the ObserveID Ticket Tracker repository.

If you are a developer, VS Code chat user, Copilot CLI user, or coding agent, start here.

This document explains:
- what this repository is building
- which docs are authoritative
- what decisions are already locked
- what work should happen first
- what must not be improvised

This is the primary control file for implementation.

---

## 2. Project Identity
This repository is building a secure, workspace-based customer ticket tracker and collaboration portal for ObserveID.

The product includes:
- customer workspaces
- workspace membership and roles
- ticket management
- internal notes vs customer-visible updates
- pages/spaces with basic Notion-like behavior
- secure share links
- auditability
- modern enterprise-grade UX

This repository is not building:
- a full Notion clone
- a full Jira replacement
- a native Xcode-first application
- a realtime collaboration platform in MVP
- a massive multi-service platform for early releases

---

## 3. Primary Product Goal
Ship a secure, polished, maintainable MVP that allows ObserveID to manage customer-facing workspaces and tickets with strong access control and a modern UX.

---

## 4. Authoritative Document Order
Read these in order before making implementation decisions:

1. `README.md`
2. `docs/BUILD_PLAN.md`
3. `docs/MVP_SCOPE.md`
4. `docs/ARCHITECTURE.md`
5. `docs/PERMISSIONS_MATRIX.md`
6. `docs/DB_SCHEMA.md`
7. `docs/UI_UX_SYSTEM.md`
8. `docs/ROUTES_AND_SCREENS.md`
9. `docs/API_CONTRACTS.md`
10. `docs/IMPLEMENTATION_SEQUENCE.md`
11. `docs/DEPENDENCY_APPROVALS.md`
12. `docs/AGENT_INSTRUCTIONS.md`
13. `docs/OPEN_QUESTIONS.md`

If a conflict appears, prefer the more specific document unless a later decision log overrides it.

---

## 5. Locked Decisions
These are already decided unless explicitly changed by approval:

- build a web app, not an Xcode-first app
- use VS Code as the primary environment
- use TypeScript end-to-end
- use Cloudflare-native infrastructure
- use React for frontend
- use Hono + Zod + Drizzle for backend/API layer
- use D1 for relational data
- use R2 for attachments
- use TipTap for pages/spaces
- use TanStack Table for ticket/data views
- use RBAC with server-side enforcement
- keep MVP intentionally focused
- do not build realtime collaboration in MVP

---

## 6. Non-Negotiable Rules
- do not add dependencies without checking `docs/DEPENDENCY_APPROVALS.md`
- do not change IAM design without approval
- do not change storage model without approval
- do not expose public access beyond documented share-link behavior
- do not rely on frontend-only permission hiding
- do not build advanced features before foundation layers are complete
- do not ignore documentation in favor of ad hoc implementation shortcuts

---

## 7. Current Repository State
The repository is documentation-first and ready to move into scaffold/build mode.

Implementation should begin with:
- project structure
- configuration
- schema and permissions foundation
- app shell
- core workspace/ticket flows

Do not begin with advanced UI polish, charts, integrations, or collaboration features.

---

## 8. What to Build First
The first implementation goal is not “the full app.”
It is the **foundation**:

1. repository structure
2. base config
3. env validation
4. DB schema/migrations
5. auth/session baseline
6. permission enforcement helpers
7. app shell
8. workspace list/overview
9. ticket list/detail

---

## 9. What Must Be Deferred
Do not implement these during initial scaffold/foundation:
- realtime collaborative editing
- advanced analytics
- charts
- automations
- third-party integrations
- white-labeling
- complex customer SSO
- mobile-native clients
- advanced workflow engines

---

## 10. How to Use This Repo in VS Code or Copilot CLI
### Recommended approach
- open the repository in VS Code
- keep this file and the implementation sequence open
- ask Copilot/agent to perform one phase at a time
- verify output before moving to the next phase
- do not request “build everything” in one step

### Good task example
“Read `docs/PROJECT_OPERATING_MANUAL.md` and `docs/SCAFFOLD_PLAN.md`. Scaffold the repository foundation only. Do not add dependencies outside the approved list. Stop after creating the base structure and config files.”

### Bad task example
“Build the full product.”

---

## 11. Expected Working Style
Work should happen in controlled increments:
- phase
- review
- approval
- next phase

Every significant phase should leave the repo in a stable state.

---

## 12. Stop Conditions
Stop and request approval if:
- a dependency outside the approved list is needed
- auth or session architecture must change
- database schema assumptions conflict with docs
- a missing product decision blocks safe implementation
- multiple reasonable implementation paths exist and the choice is architectural

---

## 13. Definition of “Ready to Code”
The repo is ready to begin coding when:
- this manual is present
- scaffold plan is present
- implementation sequence is present
- dependency rules are present
- agent instructions are present

At that point, stop writing docs unless implementation reveals a real gap.
