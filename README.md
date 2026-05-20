# ObserveID Ticket Tracker

A secure, workspace-based customer ticket tracker and collaboration portal for ObserveID.

This product is designed as a modern, Cloudflare-native web application with:
- customer workspaces
- role-based access control
- daily ticket updates
- internal notes vs customer-visible updates
- basic Notion-like pages/spaces
- controlled share links
- auditability
- strong UX for both internal and customer users

## Project Status
This repository is currently in the planning/specification phase.

The documentation in `docs/` is the source of truth for architecture, scope, security, UX, and implementation order.

## Primary Product Goals
- give each customer a secure workspace
- allow ObserveID to manage tickets and updates daily
- allow only approved members to access workspace data
- support secure, scoped shareable links
- provide modern, user-friendly ticket and workspace UX
- keep infrastructure strong but intentionally simple for a small user base

## Tech Direction
Recommended stack:
- React
- TypeScript
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- Tailwind CSS
- shadcn/ui
- TipTap
- TanStack Table

## Read These Docs First
If you are a developer, coding agent, or using VS Code chat/Copilot CLI, read these in order:

1. `docs/PROJECT_OPERATING_MANUAL.md`
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
14. `docs/COPILOT_EXECUTION_PROMPT.md`
15. `docs/SCAFFOLD_PLAN.md`

## Full Documentation Map

### Product and architecture
- `docs/BUILD_PLAN.md`
- `docs/MVP_SCOPE.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`

### Security and access
- `docs/PERMISSIONS_MATRIX.md`
- `docs/SECURITY_CHECKLIST.md`

### Data and API
- `docs/DB_SCHEMA.md`
- `docs/API_CONTRACTS.md`

### UX and screen design
- `docs/UI_UX_SYSTEM.md`
- `docs/ROUTES_AND_SCREENS.md`

### Delivery and operations
- `docs/IMPLEMENTATION_SEQUENCE.md`
- `docs/TEST_STRATEGY.md`
- `docs/ENVIRONMENT_SETUP.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/DEPENDENCY_APPROVALS.md`
- `docs/AGENT_INSTRUCTIONS.md`
- `docs/PROJECT_OPERATING_MANUAL.md`
- `docs/SCAFFOLD_PLAN.md`
- `docs/COPILOT_EXECUTION_PROMPT.md`
- `docs/OPEN_QUESTIONS.md`

## Product Philosophy
This project should not try to become a full Notion clone or a full Jira replacement in v1.

The correct product shape is:
- secure workspace per customer
- strong ticket workflows
- clear update visibility
- basic rich pages
- modern table views
- reliable permissions
- strong operational quality

## Build Rules
- prefer official Cloudflare platform services where practical
- do not add dependencies without approval
- do not change IAM architecture without approval
- enforce all permissions server-side
- keep the first version intentionally focused
- prioritize quality, clarity, and security over speed hacks

## Immediate Next Goal
Move from documentation into disciplined scaffolding:
- repo/app structure
- Cloudflare config
- TypeScript config
- DB migrations
- auth/permissions foundation
- workspace shell
- ticket system baseline
