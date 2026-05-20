# ObserveID Ticket Tracker — Open Questions

## 1. Purpose
This document records unresolved questions and assumptions that could affect implementation.

If a question is resolved, update this file and, if needed, the relevant architecture/spec docs.

---

## 2. Current Open Questions

## A. Auth flow details
### Question
Will customer sign-in be:
- passwordless email flow
- password-based login
- magic link
- mixed model

### Current assumption
Use a simple, secure initial auth model suitable for MVP, with room to evolve later.

### Why it matters
This affects session handling, invite acceptance UX, and API/auth implementation.

---

## B. Internal vs customer users in one table
### Question
Should internal and customer users share the same `users` table?

### Current assumption
Yes, with `user_type` and role/membership context.

### Why it matters
Affects schema and auth logic consistency.

---

## C. Session persistence model
### Question
Will sessions be:
- app-managed records
- provider-managed only
- hybrid

### Current assumption
Hybrid-friendly design, but exact implementation needs to be locked during auth phase.

---

## D. Share-link token return behavior
### Question
Should the raw share URL/token be visible only once at creation time?

### Current assumption
Yes, if that aligns with implementation simplicity and security goals.

### Why it matters
Affects share-link UX and storage strategy.

---

## E. Attachment security depth
### Question
Will MVP include malware/virus scanning for uploaded files?

### Current assumption
No full scanning pipeline in earliest MVP unless risk profile demands it immediately.
At minimum:
- restrict file types
- restrict sizes
- control access
- document future scanning need

---

## F. Page comments
### Question
Are page comments in MVP or post-MVP?

### Current assumption
Post-MVP / v1.5 unless a strong immediate need emerges.

---

## G. Saved views
### Question
Are saved ticket views required in MVP?

### Current assumption
Basic filtering/sorting in MVP, saved custom views deferred unless needed early.

---

## H. Board and calendar views
### Question
Should tickets support board/calendar in MVP?

### Current assumption
No. Table view first.

---

## I. Customer SSO
### Question
Should customer tenants support SSO in MVP?

### Current assumption
No. Defer unless an early customer requirement forces it.

---

## J. Branding and white-labeling
### Question
Should each customer workspace have custom branding in MVP?

### Current assumption
Minimal branding only, if any. Full white-labeling is deferred.

---

## K. Audit log exposure
### Question
Should customer admins see any customer-safe audit history?

### Current assumption
No dedicated customer audit view in MVP unless a very limited version is intentionally designed.

---

## L. Exact package naming
### Question
What exact monorepo package/app names should be used once scaffold starts?

### Current assumption
Use:
- `apps/web`
- `apps/api`
- `packages/auth`
- `packages/db`
- `packages/types`
- `packages/ui`
- `packages/config`

This is likely stable, but should be confirmed during scaffold.

---

## 3. Working Rule
If an open question blocks safe implementation:
- choose the simplest documented assumption if low-risk
- stop and request approval if it affects architecture, auth, permissions, storage, or MVP scope

---

## 4. Update Rule
When a question is resolved:
1. update this file
2. update the relevant authoritative doc
3. record the decision in `docs/DECISIONS.md` if it is significant
