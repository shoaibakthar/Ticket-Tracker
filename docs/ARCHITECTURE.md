# ObserveID Ticket Tracker — Architecture

## 1. Purpose
This document defines the target system architecture for the ObserveID Ticket Tracker MVP and near-term evolution.
It should be read together with:
- `docs/BUILD_PLAN.md`
- `docs/PERMISSIONS_MATRIX.md`
- `docs/DB_SCHEMA.md`
- `docs/MVP_SCOPE.md`

This architecture prioritizes security, maintainability, and operational simplicity over unnecessary complexity.

---

## 2. Architecture Principles
- Cloudflare-native where practical
- Strong typing end-to-end
- Clear separation between UI, API, data, and auth concerns
- Server-side authorization for all protected resources
- Minimal runtime complexity for a small user base
- Add complexity only when justified by product needs

---

## 3. High-Level System Design

### Main components
1. Web frontend
2. API backend
3. Relational database
4. Object storage
5. Authentication and access protection layer
6. Audit and observability layer

### Deployment model
- Frontend and API deployed on Cloudflare platform
- Shared multi-tenant application
- Customer data isolated by tenant/workspace scoping in application logic and queries
- Separate local, preview, and production environments

---

## 4. Runtime Components

## Frontend
### Responsibilities
- Render admin and customer-facing UI
- Handle navigation and authenticated client sessions
- Render tables, ticket views, workspace pages, and settings screens
- Provide rich text editing and file upload interactions

### Recommended stack
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table
- TipTap
- TanStack Query

---

## API Backend
### Responsibilities
- Auth/session validation
- Authorization enforcement
- Resource CRUD
- Share link validation
- Audit event generation
- File upload orchestration

### Recommended stack
- Cloudflare Workers
- TypeScript
- Hono
- Zod
- Drizzle ORM

---

## Database
### Responsibilities
- store tenants, workspaces, memberships, tickets, pages, comments, attachments metadata, share links, and audit events

### Recommended service
- Cloudflare D1

---

## File Storage
### Responsibilities
- store ticket/page attachments
- keep binary content separate from relational metadata

### Recommended service
- Cloudflare R2

---

## Abuse and access protection
### Recommended services
- Cloudflare Access for internal/admin entry protection
- Cloudflare Turnstile for invite, sign-in, and share-link entry protection where useful

---

## 5. Multi-Tenant Model

### Platform structure
- ObserveID = platform operator
- tenant = customer boundary
- workspace = operational space within tenant
- resources = tickets, pages, comments, attachments, share links

### Isolation rules
- customer users are only scoped to workspaces where they are members
- internal support access must be explicit and auditable
- all queries must filter by workspace/tenant scope

---

## 6. Suggested Repository Structure

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

### Responsibilities by package
#### apps/web
- frontend application
- workspace UI
- ticket views
- page editor UI
- settings and member screens

#### apps/api
- Worker API routes
- auth middleware
- permission enforcement
- D1 access layer
- R2 upload endpoints
- share-link resolution

#### packages/auth
- auth helpers
- permission checks
- role mapping
- session helpers

#### packages/db
- schema definitions
- migrations
- DB utilities

#### packages/types
- shared domain types
- enums/constants
- DTOs and validation-adjacent types

#### packages/ui
- shared design system components
- layout primitives
- status badges
- tables wrappers

#### packages/config
- tsconfig base
- lint configs
- formatting configs

---

## 7. Request Flow

### Authenticated application flow
1. user requests frontend page
2. frontend loads and checks session state
3. frontend calls API route
4. API resolves identity
5. API validates workspace scope
6. API checks permissions
7. API executes DB query/storage operation
8. API emits audit event if action is sensitive
9. API returns typed response

### Share-link flow
1. user opens tokenized URL
2. API validates token hash, expiry, revocation, and scope
3. API resolves target resource
4. API filters out restricted/internal data
5. response is rendered in read-only mode
6. access event is logged

---

## 8. Security Architecture

### Auth boundary
- internal and customer-facing access paths must be separated logically
- internal/admin area should be protected with Cloudflare Access plus in-app authorization
- customer-facing auth must be workspace-aware

### Authorization boundary
- every protected route requires permission checks
- internal notes and restricted metadata must be filtered at source
- never rely on frontend hiding for security

### Secrets management
- keep secrets in environment configuration managed through Cloudflare platform
- validate all required secrets at startup

### File handling
- upload through controlled API flow
- validate content type and size
- store metadata in D1 and object content in R2

---

## 9. Data Access Patterns

### General rules
- queries should always include workspace scope when accessing customer resources
- use small explicit query functions rather than generic dynamic data access
- prefer service-layer functions for business logic and permission-aware resource access

### Example access layers
- membership service
- tickets service
- pages service
- shares service
- audit service

---

## 10. Page and Content Architecture

### v1 page model
- page tree stored in `pages`
- ordered blocks stored in `page_blocks`
- basic block types only
- ticket view block references structured ticket data rather than duplicating it

### Editing model
- optimistic but non-realtime edits in MVP
- save page block state through API
- no live multi-user collaboration in v1

---

## 11. Observability and Audit

### Required logging layers
- request-level error logging
- business audit events
- access/revocation logs for share links

### Recommended operational visibility
- log failed auth attempts
- log permission denials where appropriate
- log file upload errors
- log route-level exceptions

---

## 12. Scaling Position
The product is designed for a small user base initially.
The architecture should remain intentionally simple.

### Do now
- strong typing
- strong permissions
- clear module boundaries
- automated testing
- clean migrations

### Defer until needed
- microservices
- websocket-heavy collaboration
- complex event streaming
- advanced caching layers
- distributed job orchestration

---

## 13. Future Evolution Path

### Near-term upgrades
- saved views
- page comments
- board/calendar views
- better notifications

### Medium-term upgrades
- realtime ticket activity
- collaborative editing
- customer SSO
- white-label branding
- integration APIs

### Long-term upgrades
- advanced automation
- analytics dashboards
- external integrations with support platforms

---

## 14. Architecture Definition of Done
Architecture is implementation-ready when:
- repo layout is locked
- frontend/backend boundaries are clear
- permission enforcement model is centralized
- DB schema has an initial migration plan
- storage strategy is defined
- audit strategy is defined
- testing strategy covers major flows
