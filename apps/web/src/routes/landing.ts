import type { ReactElement } from "react";

import { createElement } from "../lib/element.ts";

export function renderLandingPage(): ReactElement {
  return createElement(
    "div",
    { className: "landing-page" },
    createElement(
      "header",
      { className: "landing-page__hero" },
      createElement(
        "nav",
        { className: "landing-page__nav", "aria-label": "Landing page actions" },
        createElement("a", { className: "landing-page__brand", href: "/" }, "ObserveID Ticket Tracker"),
        createElement(
          "div",
          { className: "landing-page__nav-actions" },
          createElement("a", { className: "landing-page__nav-link", href: "#workflow" }, "Workflow"),
          createElement("a", { className: "landing-page__nav-link", href: "#proof" }, "Capabilities"),
          createElement("a", { className: "landing-page__nav-cta", href: "/workspaces/acme/tickets" }, "Open product preview"),
        ),
      ),
      createElement(
        "div",
        { className: "landing-page__hero-content" },
        createElement(
          "p",
          { className: "landing-page__eyebrow" },
          "Ticket operations, customer communication, and audit visibility in one calm workspace",
        ),
        createElement("h1", { className: "landing-page__title" }, "Resolve issues faster without losing operational clarity."),
        createElement(
          "p",
          { className: "landing-page__lead" },
          "Keep triage, field edits, customer-visible updates, internal notes, attachments, and timeline history connected so every ticket moves forward with confidence.",
        ),
        createElement(
          "div",
          { className: "landing-page__hero-actions" },
          createElement("a", { className: "landing-page__cta landing-page__cta--primary", href: "/workspaces/acme/tickets" }, "Open product preview"),
          createElement("a", { className: "landing-page__cta landing-page__cta--secondary", href: "#workflow" }, "See ticket workflow"),
        ),
      ),
      createElement(
        "div",
        { className: "landing-page__screenshot-stage", "aria-label": "Product screenshot placeholders" },
        createElement(
          "div",
          { className: "landing-page__screenshot-card" },
          createElement("p", { className: "landing-page__screenshot-label" }, "Primary hero screenshot"),
          createElement("p", { className: "landing-page__screenshot-copy" }, "Drop in the ticket list + detail split-screen product capture."),
        ),
        createElement(
          "div",
          { className: "landing-page__screenshot-card landing-page__screenshot-card--supporting" },
          createElement("p", { className: "landing-page__screenshot-label" }, "Secondary screenshot"),
          createElement("p", { className: "landing-page__screenshot-copy" }, "Use this slot for communication composer + timeline context."),
        ),
      ),
    ),
    createElement(
      "section",
      { className: "landing-page__section", id: "why" },
      createElement("h2", { className: "landing-page__section-title" }, "Why this exists"),
      createElement(
        "p",
        { className: "landing-page__section-lead" },
        "Issue handling breaks down when triage lives in one place, customer updates in another, and audit history nowhere reliable.",
      ),
      createElement(
        "div",
        { className: "landing-page__problem-grid" },
        createProblemCard(
          "Scattered issue context",
          "Teams lose time rebuilding ticket context from chat threads, inboxes, and spreadsheets before they can act.",
        ),
        createProblemCard(
          "Mixed communication channels",
          "Customer-facing updates and internal coordination get blended together, creating risk and unclear ownership.",
        ),
        createProblemCard(
          "Weak auditability",
          "Status changes, assignments, and due-date edits happen without trustworthy timeline history.",
        ),
      ),
    ),
    createElement(
      "section",
      { className: "landing-page__section", id: "workflow" },
      createElement("h2", { className: "landing-page__section-title" }, "Core workflows"),
      createElement(
        "div",
        { className: "landing-page__workflow-grid" },
        createWorkflowCard(
          "Triage",
          "Scan ticket list state, sort active work, and route issues by status, priority, and assignee.",
        ),
        createWorkflowCard(
          "Ticket operations",
          "Update status, priority, assignee, and due date with server-side validation and consistent behavior.",
        ),
        createWorkflowCard(
          "Communication separation",
          "Publish customer-visible updates while keeping internal notes private and operational.",
        ),
        createWorkflowCard(
          "Attachments + timeline history",
          "Open attachment records and see normalized timeline events for comments, updates, and field changes.",
        ),
      ),
    ),
    createElement(
      "section",
      { className: "landing-page__section", id: "proof" },
      createElement("h2", { className: "landing-page__section-title" }, "Current product capabilities"),
      createElement(
        "div",
        { className: "landing-page__proof-grid" },
        createProofItem("Ticket list and detail views are live in local preview."),
        createProofItem("Customer-visible updates and internal notes are separate in API and UI."),
        createProofItem("Attachment metadata and permission-aware download routes are active."),
        createProofItem("Timeline events are normalized for updates, notes, comments, attachments, and field changes."),
        createProofItem("Operational ticket edits include status, priority, assignee, and due date."),
        createProofItem("Server-side permission enforcement and workspace scoping are wired."),
      ),
    ),
    createElement(
      "section",
      { className: "landing-page__section landing-page__section--cta", id: "cta" },
      createElement("h2", { className: "landing-page__section-title" }, "Move from scattered issue handling to an operational workflow."),
      createElement(
        "p",
        { className: "landing-page__section-lead" },
        "Use the current preview to evaluate triage, communication control, and audit-ready ticket operations.",
      ),
      createElement(
        "div",
        { className: "landing-page__hero-actions" },
        createElement("a", { className: "landing-page__cta landing-page__cta--primary", href: "/workspaces/acme/tickets" }, "Open product preview"),
        createElement("a", { className: "landing-page__cta landing-page__cta--secondary", href: "#why" }, "Review workflow rationale"),
      ),
    ),
  );
}

function createProblemCard(title: string, body: string): ReactElement {
  return createElement(
    "article",
    { className: "landing-page__card landing-page__card--problem" },
    createElement("h3", { className: "landing-page__card-title" }, title),
    createElement("p", { className: "landing-page__card-copy" }, body),
  );
}

function createWorkflowCard(title: string, body: string): ReactElement {
  return createElement(
    "article",
    { className: "landing-page__card landing-page__card--workflow" },
    createElement("h3", { className: "landing-page__card-title" }, title),
    createElement("p", { className: "landing-page__card-copy" }, body),
  );
}

function createProofItem(copy: string): ReactElement {
  return createElement(
    "article",
    { className: "landing-page__proof-item" },
    createElement("p", { className: "landing-page__proof-copy" }, copy),
  );
}
