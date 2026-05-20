# ObserveID Ticket Tracker — MVP Scope

## 1. Purpose
This document defines the exact MVP scope for the ObserveID Ticket Tracker.
It exists to prevent overbuilding and to ensure the first release is secure, usable, and maintainable.

The MVP should deliver a strong customer workspace portal with excellent fundamentals.
It should not attempt to become a full Notion, Jira, or Zendesk replacement in version one.

---

## 2. MVP Goal
Deliver a secure multi-tenant customer workspace portal where ObserveID can:
- create customer workspaces
- invite members
- create and update tickets daily
- separate internal notes from customer-visible updates
- attach files
- create basic workspace pages
- share approved read-only links
- maintain auditability and role-based access control

---

## 3. Primary Users

### Internal users
- ObserveID admins
- ObserveID support operators

### External users
- Customer workspace owners/admins
- Customer members/viewers
- Temporary share-link viewers

---

## 4. In-Scope for MVP

## A. Authentication and access
- internal/admin access protection strategy
- customer user sign-in
- workspace membership model
- invite flow
- role-based access control
- secure sessions
- access revocation

## B. Workspace management
- create workspace
- edit workspace name/basic settings
- list workspace members
- invite workspace members
- change workspace member roles
- deactivate/remove member access

## C. Tickets
- create ticket
- edit ticket
- update title/description/status/priority/due date/assignee
- add internal note
- add customer-visible update
- list tickets in table view
- view ticket detail page/drawer
- filter/sort tickets
- attach files to tickets

## D. Pages / spaces
- basic workspace page tree
- create/edit/view page
- basic rich text content
- minimal block support
- embed a ticket database/table view in a page

## E. Sharing
- create read-only share link for approved resource types
- revoke share link
- optional expiration date
- access log basics

## F. Auditability
- audit log events for privileged actions
- actor, action, resource, timestamp capture

## G. UX baseline
- modern responsive layout
- sidebar navigation
- dashboard overview
- clear internal vs customer-visible distinctions
- accessible and simple workflows

---

## 5. Out of Scope for MVP
These should not be built in the first release unless there is a critical reason.

### Collaboration/realtime
- true multi-user collaborative editing
- live cursor presence
- websocket-heavy realtime collaboration

### Advanced ticketing
- custom workflow builders
- automation engine
- SLA policy engine with escalations
- dependency graphs between tickets
- recurring tickets
- email-to-ticket ingestion

### Advanced Notion-like features
- formulas
- relation properties
- rollups
- arbitrary database builders
- public publishing of all pages
- advanced block marketplace

### Enterprise extras to defer
- customer SSO/SAML for external users
- white-label domains
- advanced analytics dashboards
- webhook ecosystem
- full API platform for third parties
- mobile-native apps

### Nice-to-haves to defer
- board view
- calendar view
- page comments
- saved custom views if not immediately needed
- notifications center
- dark mode if it risks slowing core delivery

---

## 6. MVP Screens

### Auth and entry
- sign-in page
- invite acceptance page
- unauthorized/access denied page

### Internal/admin
- workspace list
- workspace overview
- member management
- share link management
- ticket list
- ticket detail
- page editor/viewer
- settings (basic)

### Customer-facing
- workspace overview
- ticket list
- ticket detail
- page viewer/editor (depending on role)
- profile/account page

### Shared access
- read-only shared resource page

---

## 7. MVP Page/Block Scope

### Supported block types
- heading
- paragraph
- bullet list
- checklist
- divider
- callout
- simple table
- ticket view block
- attachment block

### Not required in MVP
- code block syntax highlighting
- nested database relations
- chart blocks
- embeds from many third-party apps

---

## 8. MVP Ticket Fields
Required fields:
- ticket number
- title
- description
- status
- priority
- assignee
- due date
- created at
- updated at

Recommended additional fields:
- severity
- category
- reporter name
- visibility

Required ticket timeline items:
- internal notes
- customer-visible updates
- comments
- attachment events
- status changes

---

## 9. MVP Permission Expectations
- Internal ObserveID staff can support multiple workspaces according to role
- Customer users can only access their own workspace memberships
- Internal notes are never visible to customer users
- Share links are read-only and restricted in scope
- All privileged actions are server-authorized and auditable

For detailed rules, see `docs/PERMISSIONS_MATRIX.md`.

---

## 10. MVP Quality Bar
The MVP is only acceptable if it is:
- secure
- understandable
- reliable
- visually polished enough for customer use
- easy for internal staff to operate daily

### Minimum quality requirements
- strict typing enabled
- major flows tested
- permissions tested
- no obvious broken states
- proper loading and empty states
- audit events for sensitive actions
- rollback plan for production

---

## 11. Suggested Delivery Sequence

### Step 1
Foundation:
- repo/app structure
- environment config
- routing
- shared UI shell
- DB migration setup

### Step 2
Auth and memberships:
- user model
- workspace membership
- invite flow
- access control middleware

### Step 3
Tickets:
- schema
- CRUD
- table view
- detail view
- notes and updates
- attachments

### Step 4
Pages:
- page tree
- basic editor
- basic blocks
- ticket view embedding

### Step 5
Sharing and audit:
- share link creation/revoke
- share validation
- audit log events

### Step 6
Hardening:
- e2e tests
- permission tests
- performance and UX polish

---

## 12. Definition of MVP Complete
The MVP is complete when all of the following are true:
- an internal admin can create a customer workspace
- members can be invited and assigned roles
- a customer member can sign in and access only allowed workspace resources
- tickets can be created and updated daily
- internal notes stay internal
- customer-visible updates are visible to customer users
- files can be attached safely
- pages can be created and used for workspace documentation
- approved resources can be shared via read-only links
- audit logs exist for key actions
- core flows are tested and stable

---

## 13. Explicit Anti-Scope Reminder
Do not turn the MVP into:
- a full Notion clone
- a full enterprise BI platform
- a realtime collaboration suite
- a full service desk integration platform

Build the strongest possible foundation first.
Then expand intentionally.
