# ObserveID Ticket Tracker — Agent Instructions

## 1. Purpose
This document tells VS Code chat, Copilot CLI, and coding agents how to operate in this repository.

The goal is to keep implementation disciplined, secure, and aligned with the documented architecture.

This file is prescriptive.

---

## 2. First Rule
Before making implementation decisions, read these files in order:

1. `README.md`
2. `docs/BUILD_PLAN.md`
3. `docs/MVP_SCOPE.md`
4. `docs/ARCHITECTURE.md`
5. `docs/PERMISSIONS_MATRIX.md`
6. `docs/DB_SCHEMA.md`
7. `docs/UI_UX_SYSTEM.md`
8. `docs/ROUTES_AND_SCREENS.md`
9. `docs/IMPLEMENTATION_SEQUENCE.md`
10. `docs/DEPENDENCY_APPROVALS.md`

If a decision is ambiguous, prefer the documented direction instead of improvising.

---

## 3. Product Identity
This repository is building:
- a secure multi-tenant customer workspace portal
- a ticket tracking system
- a basic page/space system
- a customer-safe sharing mechanism

This repository is **not** building:
- a full Notion clone
- a full Jira replacement
- a realtime collaboration suite
- a native iOS/macOS app

---

## 4. Approved Technical Direction
Use:
- TypeScript
- React
- Cloudflare Workers
- D1
- R2
- Hono
- Zod
- Drizzle
- Tailwind CSS
- shadcn/ui
- TanStack Table
- TipTap

Do not substitute major stack choices without approval.

---

## 5. Architecture Rules
- follow the documented architecture
- keep frontend and backend concerns separated
- centralize permission logic
- centralize environment validation
- use strong typing throughout
- keep module responsibilities explicit
- prefer simple and readable code over abstraction-heavy code

---

## 6. Security Rules
- enforce permissions server-side
- never rely on frontend hiding for security
- never expose internal notes to customer-facing roles
- never expose data across tenants/workspaces incorrectly
- do not implement public access outside documented share-link behavior
- emit audit events for sensitive operations
- validate input on every mutation route

---

## 7. Dependency Rules
- do not add dependencies unless they are approved in `docs/DEPENDENCY_APPROVALS.md`
- if a needed dependency is not approved, stop and request approval
- do not add overlapping libraries in the same category

---

## 8. Implementation Order Rules
Follow `docs/IMPLEMENTATION_SEQUENCE.md`.

Do not skip ahead to advanced features before:
- project scaffolding exists
- environment validation exists
- schema exists
- auth and permissions exist
- app shell exists

---

## 9. UI/UX Rules
Follow `docs/UI_UX_SYSTEM.md`.

Key points:
- use TipTap for pages/spaces
- use TanStack Table for ticket/data views
- build calm, modern, trustworthy UI
- clearly separate internal vs external content
- include loading, empty, and error states
- prioritize usability over flashy effects

---

## 10. Code Quality Rules
- use strict typing
- avoid `any`
- write small focused modules
- prefer explicit function names
- keep domain logic testable
- add tests for permission-sensitive logic
- document significant decisions if implementation reveals ambiguity

---

## 11. Testing Rules
- write unit tests for core business and permission logic
- write integration tests for protected APIs
- write e2e tests for critical workflows
- add regression tests for bugs where practical

Follow `docs/TEST_STRATEGY.md`.

---

## 12. Approval Rules
Stop and request approval before:
- adding a new dependency
- changing auth architecture
- changing IAM model
- changing storage model
- adding realtime infrastructure
- making destructive schema changes
- changing share-link behavior significantly

---

## 13. Scope Rules
For MVP, prioritize:
- workspace access
- tickets
- visibility separation
- pages baseline
- share links
- auditability

Defer:
- advanced analytics
- full realtime collaboration
- complex automations
- broad integrations
- unnecessary platform complexity

---

## 14. Output Expectations for Agents
When implementing:
- keep file structure clean
- keep naming consistent with docs
- do not create unnecessary abstractions
- align API routes with route docs
- align schema with schema docs
- align permissions with permission matrix
- align UI patterns with UI/UX system

---

## 15. If Uncertain
If implementation encounters ambiguity:
1. check the docs
2. choose the simpler path that preserves security and maintainability
3. if still unclear, stop and ask for approval or clarification

---

## 16. Definition of Correct Agent Behavior
Correct behavior means:
- following the documented sequence
- not improvising major architecture changes
- not bloating dependencies
- protecting security boundaries
- implementing the MVP intentionally and cleanly
