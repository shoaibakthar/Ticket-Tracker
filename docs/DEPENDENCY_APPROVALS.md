# ObserveID Ticket Tracker — Dependency Approvals

## 1. Purpose
This document defines which dependencies are approved, deferred, or prohibited for the ObserveID Ticket Tracker.

Developers and coding agents must consult this file before adding any package.

If a package is not listed as approved, treat it as requiring explicit approval.

---

## 2. Dependency Policy
- prefer the smallest set of high-value dependencies
- prefer mature, well-maintained libraries
- prefer libraries aligned with Cloudflare and React/TypeScript ecosystem
- avoid overlapping libraries solving the same problem
- avoid dependencies that add major architectural complexity in MVP

---

## 3. Approved Core Runtime and App Dependencies

### Language and framework
- TypeScript
- React

### Styling and UI
- Tailwind CSS
- shadcn/ui
- class-variance-authority
- clsx
- tailwind-merge

### Data fetching and state
- TanStack Query

### Tables
- TanStack Table

### Rich text / pages
- TipTap core packages needed for MVP editor
- approved TipTap extensions needed for MVP block functionality only

### Backend/API
- Hono
- Zod
- Drizzle ORM

### Testing
- Vitest
- Playwright
- Testing Library packages if needed for component behavior tests

### Cloudflare tooling
- Wrangler
- official Cloudflare SDK/tooling required for Workers, D1, R2, or Pages integration

---

## 4. Approved Utility Categories
Use only when clearly needed:
- date utility library with strong maintenance
- lightweight ID generation utility
- lightweight schema/helper utilities that do not duplicate Zod or Drizzle

These still require review before actual addition if not explicitly named.

---

## 5. Deferred Dependencies
These are not approved for MVP by default but may be added later with explicit approval.

### Charts and analytics
- Recharts
- Apache ECharts
- Tremor

### Advanced data grid
- AG Grid
- Handsontable

### Realtime/collaboration
- websocket abstraction libraries
- CRDT collaboration libraries
- presence/collaboration frameworks

### Auth expansion
- enterprise SSO/SAML packages for customer tenants
- complex OAuth provider ecosystems beyond initial needs

### Workflow/automation
- automation engines
- queue/job orchestration packages unless a concrete need appears

---

## 6. Not Selected / Avoid for MVP

### Editors
- Editor.js
- ProseMirror direct integration unless TipTap cannot satisfy a requirement

Reason:
TipTap is the approved path for pages/spaces in MVP.

### Table alternatives
- AG Grid by default
- Handsontable by default

Reason:
TanStack Table is the approved baseline and better aligned to custom premium UI.

### Overbuilt state solutions
- multiple overlapping global state libraries
- Redux-class complexity unless a specific need emerges

Reason:
Keep state management simple.

---

## 7. Prohibited or Strongly Discouraged Patterns
- adding multiple UI kits at once
- adding multiple table libraries
- adding multiple editor systems
- adding multiple validation systems overlapping with Zod
- adding backend frameworks redundant with Hono
- adding ORMs or query builders redundant with Drizzle
- adding abandoned packages
- adding poorly maintained auth libraries without review

---

## 8. Approval Rules
A dependency addition requires explicit approval when it:
- is not listed in the approved section
- changes auth architecture
- changes data layer architecture
- introduces realtime infra
- introduces large UI/system complexity
- overlaps with an approved dependency

---

## 9. Approved UX Stack Summary
These decisions are locked for MVP:

### Pages / spaces
- TipTap

### Ticket/data tables
- TanStack Table

### UI primitives
- shadcn/ui + Tailwind CSS

### Query/data fetching
- TanStack Query

### API/validation/data
- Hono + Zod + Drizzle

---

## 10. Definition of Dependency Compliance
Dependency usage is compliant when:
- every package added is approved or explicitly reviewed
- no redundant libraries exist in the same problem category
- the dependency list stays intentionally small
- the chosen libraries align with the documented product architecture
