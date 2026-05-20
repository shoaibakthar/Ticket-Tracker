# ObserveID Ticket Tracker — Scaffold Plan

## 1. Purpose
This document defines the exact initial repository scaffold plan.

Its purpose is to remove ambiguity so developers and coding agents do not invent project structure.

This plan covers:
- project layout
- package names
- initial folders
- initial config files
- initial scripts
- build order for scaffold only

---

## 2. Scaffold Strategy
Use a monorepo-style layout.

### Why
- clean separation between frontend, API, and shared packages
- better control of shared types/auth/db/ui
- safer long-term growth without unnecessary complexity

---

## 3. Target Initial Repository Layout

```text
apps/
  web/
  api/

packages/
  auth/
  db/
  types/
  ui/
  config/

docs/
```

---

## 4. Package Purposes

### `apps/web`
Frontend application.

Responsibilities:
- UI shell
- workspace screens
- ticket screens
- page editor integration
- member/share/settings screens

### `apps/api`
Cloudflare Worker API.

Responsibilities:
- route handlers
- auth/session resolution
- permission enforcement
- D1/R2 interactions
- audit event generation

### `packages/auth`
Shared auth/permission utilities.

Responsibilities:
- role constants
- permission constants
- access-check helpers
- request-context helpers

### `packages/db`
Database package.

Responsibilities:
- schema definitions
- migrations
- DB helpers
- seed helpers later

### `packages/types`
Shared domain types and constants.

Responsibilities:
- ticket status constants
- role enums/constants
- DTO/shared shapes
- common value objects

### `packages/ui`
Shared UI components and primitives.

Responsibilities:
- layout shell pieces
- badges
- cards
- tables wrappers
- forms primitives
- empty/loading/error state components

### `packages/config`
Shared config package if needed.

Responsibilities:
- tsconfig base
- lint config
- formatting config

---

## 5. Required Initial Root Files
These should exist early in scaffold:

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `.gitignore`
- `.editorconfig`
- `README.md`

Optional soon after:
- root lint config
- root formatting config
- root test command wiring

---

## 6. Initial App Files

### `apps/web`
Initial expected files/folders:
- app entry/root
- routes/pages shell
- global styles
- shared app layout
- placeholder screens for overview and tickets

### `apps/api`
Initial expected files/folders:
- worker entry
- route registration
- middleware folder
- auth helpers integration point
- environment validation
- placeholder health/session route

---

## 7. Initial Package Files

### `packages/auth`
- permission constants
- role constants
- access-check utilities

### `packages/db`
- schema entry
- migration folder
- db config helpers

### `packages/types`
- domain constants
- shared types
- status/role value sets

### `packages/ui`
- button wrapper or primitive export pattern
- badge/status components
- layout helpers
- empty state component

### `packages/config`
- base tsconfig
- shared lint config if used

---

## 8. Root Script Expectations
Root scripts should eventually support:
- install
- dev
- typecheck
- lint
- test
- e2e
- migrate
- seed

During initial scaffold, define only what can actually work.

---

## 9. Scaffold Build Order

### Step 1
Create root workspace structure.

### Step 2
Create root config files.

### Step 3
Create app folders.

### Step 4
Create package folders.

### Step 5
Wire TypeScript base config.

### Step 6
Add approved dependencies only.

### Step 7
Create minimal app/api entrypoints.

### Step 8
Create minimal shared packages with placeholder exports.

### Step 9
Confirm repository can install and typecheck baseline structure.

---

## 10. What Not to Scaffold Yet
Do not build these during the scaffold phase:
- full auth implementation
- full ticket CRUD
- page editor implementation
- share-link logic
- complex UI styling
- advanced testing harness beyond baseline setup
- charts
- integrations

Scaffold should focus on **structure**, not feature completion.

---

## 11. Scaffold Definition of Done
Scaffold phase is complete when:
- project layout exists
- root workspace config exists
- app and package folders exist
- TypeScript base config is wired
- approved initial dependencies are installed
- apps have minimal entrypoints
- project structure matches this document
