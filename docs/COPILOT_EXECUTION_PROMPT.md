# ObserveID Ticket Tracker — Copilot / VS Code Chat Execution Prompt

## 1. Purpose
This file provides the recommended master prompt/instruction set for VS Code chat, Copilot CLI, or a coding agent working in this repository.

Use this prompt as the initial instruction when beginning implementation.

---

## 2. Recommended Master Prompt

You are implementing the ObserveID Ticket Tracker repository.

Before making any changes, read these files in order:

1. README.md
2. docs/PROJECT_OPERATING_MANUAL.md
3. docs/BUILD_PLAN.md
4. docs/MVP_SCOPE.md
5. docs/ARCHITECTURE.md
6. docs/PERMISSIONS_MATRIX.md
7. docs/DB_SCHEMA.md
8. docs/UI_UX_SYSTEM.md
9. docs/ROUTES_AND_SCREENS.md
10. docs/API_CONTRACTS.md
11. docs/IMPLEMENTATION_SEQUENCE.md
12. docs/DEPENDENCY_APPROVALS.md
13. docs/AGENT_INSTRUCTIONS.md
14. docs/OPEN_QUESTIONS.md
15. docs/SCAFFOLD_PLAN.md

Follow these rules strictly:

- Do not add dependencies that are not approved in docs/DEPENDENCY_APPROVALS.md.
- Do not change the architecture, IAM model, auth model, storage model, or major package choices without stopping and asking for approval.
- Do not implement features outside MVP scope.
- Do not build realtime collaboration, charts, or advanced automations in MVP.
- Enforce permissions server-side.
- Keep internal notes completely separated from customer-visible updates.
- Use TypeScript throughout.
- Use TipTap for page editing.
- Use TanStack Table for ticket/data views.
- Use Cloudflare-native patterns for Workers, D1, and R2.

Work in phases, not all at once.

Current assignment:
Read the docs and execute only the current requested phase.
If the requested phase is ambiguous, choose the simplest safe interpretation.
If a decision is architectural or requires a new dependency, stop and ask for approval.

When done, summarize:
- what was created
- what assumptions were made
- what is still pending
- whether any approval is needed before the next phase

---

## 3. Recommended First Tasks

### First prompt for scaffold phase
Read `docs/PROJECT_OPERATING_MANUAL.md`, `docs/SCAFFOLD_PLAN.md`, and `docs/DEPENDENCY_APPROVALS.md`. Scaffold the repository structure only. Create the agreed folders and baseline config files. Do not implement product features yet. Do not add unapproved dependencies. Stop after the scaffold is complete and summarize the result.

### Second prompt for shared foundations
Read `docs/DB_SCHEMA.md`, `docs/PERMISSIONS_MATRIX.md`, and `docs/IMPLEMENTATION_SEQUENCE.md`. Implement only the shared domain foundations:
- role/permission constants
- status/priority constants
- schema placeholders
- environment validation placeholders
Do not implement auth or UI features yet.

### Third prompt for app shell
Read `docs/UI_UX_SYSTEM.md` and `docs/ROUTES_AND_SCREENS.md`. Implement only the baseline app shell and route placeholders. Do not implement full CRUD or editor behavior yet.

---

## 4. Usage Guidance
Use one phase at a time.
Do not paste the entire repo docs into every prompt; reference this file and the docs list.

If using VS Code chat:
- keep this file open
- keep the scaffold or current phase docs open
- ask for small, reviewable changes

If using Copilot CLI:
- run one milestone at a time
- review diffs between phases
- avoid “finish the whole app” style prompts

---

## 5. Stop Conditions
The agent must stop and request approval if:
- an unapproved dependency is required
- there is a conflict between docs
- auth/session architecture needs to change
- database schema needs a structural change
- the implementation would move outside MVP scope
