import type { ReactElement } from "react";

import { EmptyStatePlaceholder } from "../components/states/empty-state.ts";
import { ErrorStatePlaceholder } from "../components/states/error-state.ts";
import { LoadingStatePlaceholder } from "../components/states/loading-state.ts";
import { ScreenPlaceholder } from "../components/screen-placeholder.ts";
import { createElement } from "../lib/element.ts";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types.ts";

function renderTicketsScreen({
  routeState,
  workspaceSlug,
  sessionBootstrap,
  ticketList,
  ticketListError,
  ticketDetail,
  ticketDetailError,
}: PlaceholderScreenProps): ReactElement {
  if (routeState.ticketId) {
    return renderTicketDetailScreen({
      workspaceSlug,
      ticketId: routeState.ticketId,
      sessionBootstrap,
      ticketDetail,
      ticketDetailError,
    });
  }

  if (ticketListError) {
    return createElement(
      "section",
      { className: "tickets-screen" },
      createElement("h2", { className: "tickets-screen__title" }, "Tickets"),
      createElement(
        "p",
        { className: "tickets-screen__subtitle" },
        "The ticket list could not be loaded for this workspace preview.",
      ),
      createElement(ErrorStatePlaceholder, {
        title: "Ticket list unavailable",
        body: ticketListError,
      }),
    );
  }

  if (ticketList) {
    if (ticketList.items.length === 0) {
      return createElement(
        "section",
        { className: "tickets-screen" },
        createElement("h2", { className: "tickets-screen__title" }, ticketList.workspace.name),
        createElement(
          "p",
          { className: "tickets-screen__subtitle" },
          "This workspace is ready for ticket work, but no tickets have been created yet.",
        ),
        createElement(EmptyStatePlaceholder, {
          title: "No tickets yet",
          body: "Ticket list, filters, and detail navigation stay empty until the first ticket enters the workspace.",
          actionLabel: "Create Ticket",
        }),
        sessionBootstrap?.user
          ? createElement(
              "p",
              { className: "tickets-screen__footer" },
              `Visible to ${sessionBootstrap.user.displayName ?? sessionBootstrap.user.email}`,
            )
          : null,
      );
    }

    return createElement(
      "section",
      { className: "tickets-screen" },
      createElement(
        "div",
        { className: "tickets-screen__header" },
        createElement("h2", { className: "tickets-screen__title" }, ticketList.workspace.name),
        createElement(
          "p",
          { className: "tickets-screen__subtitle" },
          "A lightweight, accessible workspace ticket list foundation with safe summary fields only.",
        ),
      ),
      createElement(
        "div",
        { className: "tickets-screen__table-wrap" },
        createElement(
          "table",
          { className: "tickets-table" },
          createElement(
            "thead",
            null,
            createElement(
              "tr",
              null,
              createElement("th", { scope: "col" }, "Ticket"),
              createElement("th", { scope: "col" }, "Status"),
              createElement("th", { scope: "col" }, "Priority"),
              createElement("th", { scope: "col" }, "Assignee"),
              createElement("th", { scope: "col" }, "Updated"),
            ),
          ),
          createElement(
            "tbody",
            null,
            ...ticketList.items.map((ticket) =>
              createElement(
                "tr",
                { key: ticket.id },
                createElement(
                  "td",
                  { className: "tickets-table__ticket" },
                  createElement(
                    "a",
                    { className: "tickets-table__link", href: ticket.href },
                    createElement("strong", { className: "tickets-table__number" }, ticket.ticketNumber),
                    createElement("span", { className: "tickets-table__title" }, ticket.title),
                  ),
                ),
                createElement("td", null, ticket.status),
                createElement("td", null, ticket.priority),
                createElement(
                  "td",
                  null,
                  ticket.assignee ? ticket.assignee.displayName ?? ticket.assignee.email : "Unassigned",
                ),
                createElement("td", null, formatUpdatedAt(ticket.updatedAt)),
              ),
            ),
          ),
        ),
      ),
      sessionBootstrap?.user
        ? createElement(
            "p",
            { className: "tickets-screen__footer" },
            `Signed in as ${sessionBootstrap.user.displayName ?? sessionBootstrap.user.email}`,
          )
        : null,
    );
  }

  return ScreenPlaceholder({
    workspaceSlug,
    routeState,
    sessionBootstrap,
    workspaceOverview: null,
    ticketList,
    ticketListError,
    ticketDetail,
    ticketDetailError,
    requiredPermissions: ticketsRoute.requiredPermissions,
    routePath: `/workspaces/${workspaceSlug}/tickets`,
    title: "Tickets",
    description: "The primary operational list for workspace-scoped ticket work, with safe separation from detail behavior added later.",
    primaryActionLabel: "Create Ticket",
    bodyTitle: "Ticket list shell",
    bodyDescription: "This rendered shell reserves space for a table-first ticket list, lightweight filters, and action entry points once real data is wired.",
  });
}

function renderTicketDetailScreen(options: {
  readonly workspaceSlug: string;
  readonly ticketId: string;
  readonly sessionBootstrap: PlaceholderScreenProps["sessionBootstrap"];
  readonly ticketDetail: PlaceholderScreenProps["ticketDetail"];
  readonly ticketDetailError: string | null;
}): ReactElement {
  if (options.ticketDetailError) {
    return createElement(
      "section",
      { className: "ticket-detail-screen" },
      createElement("h2", { className: "ticket-detail-screen__title" }, "Ticket detail"),
      createElement(
        "p",
        { className: "ticket-detail-screen__subtitle" },
        "The ticket detail screen could not be loaded for this workspace preview.",
      ),
      createElement(ErrorStatePlaceholder, {
        title: "Ticket detail unavailable",
        body: options.ticketDetailError,
      }),
    );
  }

  if (options.ticketDetail) {
    const { ticket, access, workspace, sections } = options.ticketDetail;
    const detailPath = `/workspaces/${options.workspaceSlug}/tickets/${options.ticketId}`;

    return createElement(
      "section",
      { className: "ticket-detail-screen" },
      createElement(
        "div",
        { className: "ticket-detail-screen__header" },
        createElement(
          "a",
          {
            className: "ticket-detail-screen__back-link",
            href: `/workspaces/${options.workspaceSlug}/tickets`,
          },
          "Back to tickets",
        ),
        createElement(
          "div",
          { className: "ticket-detail-screen__metadata-row" },
          createElement("span", { className: "ticket-detail-screen__badge" }, ticket.ticketNumber),
          createElement("span", { className: "ticket-detail-screen__badge" }, ticket.status),
          createElement("span", { className: "ticket-detail-screen__badge" }, ticket.priority),
        ),
        createElement("h2", { className: "ticket-detail-screen__title" }, ticket.title),
        createElement(
          "p",
          { className: "ticket-detail-screen__subtitle" },
          `Workspace: ${workspace.name}. This read-only detail view keeps internal and customer-facing sections clearly separated.`,
        ),
        createElement(
          "div",
          { className: "ticket-detail-screen__facts" },
          renderDetailFact("Assignee", ticket.assignee ? ticket.assignee.displayName ?? ticket.assignee.email : "Unassigned"),
          renderDetailFact("Due date", ticket.dueDate ? formatUpdatedAt(ticket.dueDate) : "Not scheduled"),
          renderDetailFact("Updated", formatUpdatedAt(ticket.updatedAt)),
        ),
      ),
      createElement(
        "div",
        { className: "ticket-detail-screen__grid" },
        createElement(
          "section",
          { className: "ticket-detail-screen__card" },
          createElement("h3", { className: "ticket-detail-screen__card-title" }, "Issue summary"),
          createElement(
            "p",
            { className: "ticket-detail-screen__card-body" },
            ticket.description ?? "No description has been added for this ticket yet.",
          ),
          createElement(
            "div",
            { className: "ticket-detail-screen__standing" },
            createElement("p", { className: "ticket-detail-screen__standing-label" }, "Current standing"),
            createElement("p", { className: "ticket-detail-screen__standing-body" }, options.ticketDetail.summary.currentStanding),
          ),
        ),
        createElement(
          "section",
          { className: "ticket-detail-screen__card" },
          createElement("h3", { className: "ticket-detail-screen__card-title" }, "Metadata"),
          createElement("p", { className: "ticket-detail-screen__card-body" }, `Status: ${ticket.status}`),
          createElement("p", { className: "ticket-detail-screen__card-body" }, `Priority: ${ticket.priority}`),
          createElement(
            "p",
            { className: "ticket-detail-screen__card-body" },
            `Ticket number: ${ticket.ticketNumber}`,
          ),
          createElement(
            "p",
            { className: "ticket-detail-screen__card-body" },
            `Assignee: ${ticket.assignee ? ticket.assignee.displayName ?? ticket.assignee.email : "Unassigned"}`,
          ),
          createElement(
            "p",
            { className: "ticket-detail-screen__card-body" },
            `Due date: ${ticket.dueDate ? formatUpdatedAt(ticket.dueDate) : "Not scheduled"}`,
          ),
        ),
      ),
      createElement(
        "div",
        { className: "ticket-detail-screen__sections" },
        renderCommunicationSection({
          title: "Customer-visible updates",
          visibilityLabel: "Customer-visible",
          items: sections.customerVisibleUpdates,
          emptyBody: "No customer-facing updates have been posted yet.",
          composer: access.canCreateCustomerUpdates
            ? {
                title: "Post customer update",
                description: "Visible to customer-facing workspace members who can access this ticket.",
                intent: "create-customer-update",
                action: detailPath,
                submitLabel: "Post customer update",
                fieldLabel: "Customer update",
                fieldName: "message",
              }
            : null,
          restrictedMessage: "You can review customer-visible updates here, but you cannot post new ones with your current role.",
        }),
        access.canViewInternalNotes
          ? renderCommunicationSection({
              title: "Internal notes",
              visibilityLabel: "Internal-only",
              items: sections.internalNotes ?? [],
              emptyBody: "No internal notes have been captured for this ticket yet.",
              composer: access.canCreateInternalNotes
                ? {
                    title: "Add internal note",
                    description: "Internal notes stay hidden from customer-facing roles and should only capture staff-only context.",
                    intent: "create-internal-note",
                    action: detailPath,
                    submitLabel: "Save internal note",
                    fieldLabel: "Internal note",
                    fieldName: "message",
                  }
                : null,
              restrictedMessage:
                "You can review internal notes here, but you cannot add new ones with your current role.",
            })
          : renderProtectedSection(
              "Internal notes",
              "Internal-only",
              "Internal notes exist as a protected staff-only section and are not visible to your current role.",
            ),
        renderActivitySection(
          "Comments / activity",
          "Workspace timeline",
          sections.commentsActivity,
          "No comments or activity summaries are available for this ticket yet.",
        ),
        renderAttachmentSection(
          "Attachments",
          access.canViewAttachments ? "Read-only metadata" : "Protected",
          sections.attachments,
          access.canViewAttachments
            ? "No attachment metadata has been captured for this ticket yet."
            : "Attachments are permission-aware and are not available to your current role.",
        ),
      ),
      options.sessionBootstrap?.user
        ? createElement(
            "p",
            { className: "ticket-detail-screen__footer" },
            `Signed in as ${options.sessionBootstrap.user.displayName ?? options.sessionBootstrap.user.email}`,
          )
        : null,
    );
  }

  return createElement(
    "section",
    { className: "ticket-detail-screen" },
    createElement(
      "div",
      { className: "ticket-detail-screen__header" },
      createElement("p", { className: "screen-placeholder__eyebrow" }, `Ticket / ${options.ticketId}`),
      createElement("h2", { className: "ticket-detail-screen__title" }, "Ticket detail"),
      createElement(
        "p",
        { className: "ticket-detail-screen__subtitle" },
        "This read-only detail shell keeps metadata, updates, internal notes, activity, and attachments in predictable sections.",
      ),
    ),
    createElement(LoadingStatePlaceholder, {}),
    createElement(
      "div",
      { className: "ticket-detail-screen__sections" },
      renderProtectedSection(
        "Customer-visible updates",
        "Customer-visible",
        "Daily customer-facing updates will render here once the detail route is backed by timeline data.",
      ),
      renderProtectedSection(
        "Internal notes",
        "Internal-only",
        "Internal notes remain visually and permission-wise separate from customer-facing content.",
      ),
      renderProtectedSection(
        "Comments / activity",
        "Workspace timeline",
        "Comments and activity history will land here in a later ticket timeline slice.",
      ),
      renderProtectedSection(
        "Attachments",
        "Read-only placeholder",
        "Attachments metadata and download actions will be rendered here later.",
      ),
    ),
  );
}

function renderCommunicationSection(options: {
  readonly title: string;
  readonly visibilityLabel: string;
  readonly items: readonly {
    readonly id: string;
    readonly message: string;
    readonly createdAt: string;
    readonly author: {
      readonly displayName: string | null;
      readonly email: string;
    };
  }[];
  readonly emptyBody: string;
  readonly composer: {
    readonly title: string;
    readonly description: string;
    readonly intent: string;
    readonly action: string;
    readonly submitLabel: string;
    readonly fieldLabel: string;
    readonly fieldName: string;
  } | null;
  readonly restrictedMessage: string;
}): ReactElement {
  return createElement(
    "section",
    { className: "ticket-detail-screen__section-card" },
    createElement("p", { className: "ticket-detail-screen__section-eyebrow" }, options.visibilityLabel),
    createElement("h3", { className: "ticket-detail-screen__card-title" }, options.title),
    options.items.length > 0
      ? createElement(
          "ol",
          { className: "ticket-detail-screen__timeline-list" },
          ...options.items.map((item) => renderTimelineEntry(item.id, item.message, item.createdAt, item.author)),
        )
      : createElement(EmptyStatePlaceholder, {
          title: "Nothing here yet",
          body: options.emptyBody,
        }),
    options.composer
      ? renderComposer(options.composer)
      : createElement(
          "p",
          { className: "ticket-detail-screen__composer-note" },
          options.restrictedMessage,
        ),
  );
}

function renderDetailFact(label: string, value: string): ReactElement {
  return createElement(
    "div",
    { className: "ticket-detail-screen__fact" },
    createElement("p", { className: "ticket-detail-screen__fact-label" }, label),
    createElement("p", { className: "ticket-detail-screen__fact-value" }, value),
  );
}

function renderProtectedSection(
  title: string,
  visibilityLabel: string,
  body: string,
): ReactElement {
  return createElement(
    "section",
    { className: "ticket-detail-screen__section-card" },
    createElement("p", { className: "ticket-detail-screen__section-eyebrow" }, visibilityLabel),
    createElement("h3", { className: "ticket-detail-screen__card-title" }, title),
    createElement(
      EmptyStatePlaceholder,
      {
        title: "Nothing here yet",
        body,
      },
    ),
  );
}

function renderActivitySection(
  title: string,
  visibilityLabel: string,
  items: readonly {
    readonly id: string;
    readonly visibility: "customer" | "internal";
    readonly message: string;
    readonly createdAt: string;
    readonly author: {
      readonly displayName: string | null;
      readonly email: string;
    };
  }[],
  emptyBody: string,
): ReactElement {
  return createElement(
    "section",
    { className: "ticket-detail-screen__section-card" },
    createElement("p", { className: "ticket-detail-screen__section-eyebrow" }, visibilityLabel),
    createElement("h3", { className: "ticket-detail-screen__card-title" }, title),
    items.length > 0
      ? createElement(
          "ol",
          { className: "ticket-detail-screen__timeline-list" },
          ...items.map((item) =>
            renderTimelineEntry(
              item.id,
              item.message,
              item.createdAt,
              item.author,
              item.visibility === "internal" ? "Internal comment" : "Customer comment",
            ),
          ),
        )
      : createElement(EmptyStatePlaceholder, {
          title: "Nothing here yet",
          body: emptyBody,
        }),
  );
}

function renderAttachmentSection(
  title: string,
  visibilityLabel: string,
  items: readonly {
    readonly id: string;
    readonly visibility: "customer" | "internal";
    readonly filename: string;
    readonly contentType: string;
    readonly sizeBytes: number;
    readonly createdAt: string;
  }[],
  emptyBody: string,
): ReactElement {
  return createElement(
    "section",
    { className: "ticket-detail-screen__section-card" },
    createElement("p", { className: "ticket-detail-screen__section-eyebrow" }, visibilityLabel),
    createElement("h3", { className: "ticket-detail-screen__card-title" }, title),
    items.length > 0
      ? createElement(
          "ul",
          { className: "ticket-detail-screen__attachment-list" },
          ...items.map((item) =>
            createElement(
              "li",
              { key: item.id, className: "ticket-detail-screen__attachment-item" },
              createElement("strong", { className: "ticket-detail-screen__attachment-name" }, item.filename),
              createElement(
                "p",
                { className: "ticket-detail-screen__attachment-meta" },
                `${item.visibility === "internal" ? "Internal" : "Customer"} attachment · ${item.contentType} · ${formatFileSize(item.sizeBytes)} · Added ${formatUpdatedAt(item.createdAt)}`,
              ),
            ),
          ),
        )
      : createElement(EmptyStatePlaceholder, {
          title: "Nothing here yet",
          body: emptyBody,
        }),
  );
}

function renderTimelineEntry(
  key: string,
  message: string,
  createdAt: string,
  author: {
    readonly displayName: string | null;
    readonly email: string;
  },
  badgeLabel?: string,
): ReactElement {
  return createElement(
    "li",
    { key, className: "ticket-detail-screen__timeline-item" },
    createElement(
      "div",
      { className: "ticket-detail-screen__timeline-meta" },
      badgeLabel
        ? createElement("span", { className: "ticket-detail-screen__timeline-badge" }, badgeLabel)
        : null,
      createElement(
        "p",
        { className: "ticket-detail-screen__timeline-author" },
        author.displayName ?? author.email,
      ),
      createElement("p", { className: "ticket-detail-screen__timeline-date" }, formatUpdatedAt(createdAt)),
    ),
    createElement("p", { className: "ticket-detail-screen__timeline-message" }, message),
  );
}

function renderComposer(options: {
  readonly title: string;
  readonly description: string;
  readonly intent: string;
  readonly action: string;
  readonly submitLabel: string;
  readonly fieldLabel: string;
  readonly fieldName: string;
}): ReactElement {
  return createElement(
    "form",
    {
      className: "ticket-detail-screen__composer",
      method: "post",
      action: options.action,
    },
    createElement("input", {
      type: "hidden",
      name: "intent",
      value: options.intent,
    }),
    createElement("h4", { className: "ticket-detail-screen__composer-title" }, options.title),
    createElement("p", { className: "ticket-detail-screen__composer-description" }, options.description),
    createElement("label", { className: "ticket-detail-screen__composer-label" }, options.fieldLabel),
    createElement("textarea", {
      className: "ticket-detail-screen__composer-input",
      name: options.fieldName,
      rows: 4,
      placeholder: "Write a clear update using plain text.",
      required: true,
    }),
    createElement(
      "div",
      { className: "ticket-detail-screen__composer-actions" },
      createElement(
        "button",
        { className: "ticket-detail-screen__composer-button", type: "submit" },
        options.submitLabel,
      ),
    ),
  );
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ticketsRoute: PlaceholderRouteModule = {
  id: "tickets",
  pathTemplate: "/workspaces/:workspaceSlug/tickets",
  title: "Tickets",
  summary: "Show the workspace ticket list with room for table-based operations later.",
  navigationLabel: "Tickets",
  placeholder: true,
  requiredPermissions: ["workspace.view", "tickets.view"],
  buildPath: (workspaceSlug) => `/workspaces/${workspaceSlug}/tickets`,
  renderScreen: renderTicketsScreen,
};
