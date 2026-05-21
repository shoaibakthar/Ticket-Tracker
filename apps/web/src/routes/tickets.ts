import type { ReactElement } from "react";
import { ticketListSortValues, type TicketListSort } from "../../../../packages/types/src/tickets.ts";

import { EmptyStatePlaceholder } from "../components/states/empty-state.ts";
import { ErrorStatePlaceholder } from "../components/states/error-state.ts";
import { LoadingStatePlaceholder } from "../components/states/loading-state.ts";
import { ScreenPlaceholder } from "../components/screen-placeholder.ts";
import { createElement } from "../lib/element.ts";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types.ts";

const defaultTicketListSort: TicketListSort = "updated_desc";

function renderTicketsScreen({
  routeState,
  workspaceSlug,
  sessionBootstrap,
  ticketList,
  ticketListError,
  ticketDetail,
  ticketDetailError,
  ticketCommunicationSubmission,
  ticketFieldEditSubmission,
}: PlaceholderScreenProps): ReactElement {
  if (routeState.ticketId) {
    return renderTicketDetailScreen({
      workspaceSlug,
      ticketId: routeState.ticketId,
      sessionBootstrap,
      ticketDetail,
      ticketDetailError,
      ticketCommunicationSubmission,
      ticketFieldEditSubmission,
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
    const ticketsPath = `/workspaces/${workspaceSlug}/tickets`;
    const hasActiveFilters =
      ticketList.filters.applied.status !== null ||
      ticketList.filters.applied.priority !== null ||
      ticketList.filters.applied.assigneeMemberId !== null ||
      ticketList.filters.applied.q !== null ||
      ticketList.filters.applied.sort !== defaultTicketListSort;

    if (ticketList.items.length === 0) {
      return createElement(
        "section",
        { className: "tickets-screen" },
        createElement("h2", { className: "tickets-screen__title" }, ticketList.workspace.name),
        createElement(
          "p",
          { className: "tickets-screen__subtitle" },
          hasActiveFilters
            ? "No tickets match the current triage filters yet."
            : "This workspace is ready for ticket work, but no tickets have been created yet.",
        ),
        renderTicketListToolbar(ticketList, ticketsPath),
        createElement(EmptyStatePlaceholder, {
          title: hasActiveFilters ? "No matching tickets" : "No tickets yet",
          body: hasActiveFilters
            ? "Try clearing one or more filters or broadening your search to surface the right work."
            : "Ticket list, filters, and detail navigation stay empty until the first ticket enters the workspace.",
          ...(hasActiveFilters ? {} : { actionLabel: "Create Ticket" }),
        }),
        hasActiveFilters
          ? createElement(
              "p",
              { className: "tickets-screen__reset" },
              createElement("a", { href: ticketsPath }, "Reset filters"),
            )
          : null,
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
          "Use filters, search, and sort to triage the current workspace queue without leaving the list.",
        ),
      ),
      renderTicketListToolbar(ticketList, ticketsPath),
      createElement(
        "p",
        { className: "tickets-screen__results" },
        ticketList.filters.filteredCount === ticketList.filters.totalVisibleCount && !hasActiveFilters
          ? `${formatTicketCount(ticketList.filters.totalVisibleCount)} in this workspace.`
          : ticketList.filters.filteredCount === ticketList.filters.totalVisibleCount
            ? `${formatTicketCount(ticketList.filters.filteredCount)} shown.`
            : `${formatTicketCount(ticketList.filters.filteredCount)} of ${formatTicketCount(ticketList.filters.totalVisibleCount)} shown.`,
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
                  createElement(
                    "td",
                    null,
                    createElement(
                      "span",
                      { className: "tickets-table__pill tickets-table__pill--status" },
                      formatTicketListLabel(ticket.status),
                    ),
                  ),
                  createElement(
                    "td",
                    null,
                    createElement(
                      "span",
                      { className: "tickets-table__pill tickets-table__pill--priority" },
                      formatTicketListLabel(ticket.priority),
                    ),
                  ),
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

function renderTicketListToolbar(ticketList: NonNullable<PlaceholderScreenProps["ticketList"]>, ticketsPath: string) {
  return createElement(
    "form",
    { className: "tickets-filters", action: ticketsPath, method: "get" },
    createElement(
      "label",
      { className: "tickets-filters__field tickets-filters__field--search" },
      createElement("span", { className: "tickets-filters__label" }, "Search"),
      createElement("input", {
        className: "tickets-filters__control",
        type: "search",
        name: "q",
        defaultValue: ticketList.filters.applied.q ?? "",
        placeholder: "Search ticket number, title, or description",
      }),
    ),
    createElement(
      "label",
      { className: "tickets-filters__field" },
      createElement("span", { className: "tickets-filters__label" }, "Status"),
      createElement(
        "select",
        {
          className: "tickets-filters__control",
          name: "status",
          defaultValue: ticketList.filters.applied.status ?? "",
        },
        createElement("option", { value: "" }, "All statuses"),
        ...ticketList.filters.statusOptions.map((status) =>
          createElement("option", { key: status, value: status }, formatTicketListLabel(status)),
        ),
      ),
    ),
    createElement(
      "label",
      { className: "tickets-filters__field" },
      createElement("span", { className: "tickets-filters__label" }, "Priority"),
      createElement(
        "select",
        {
          className: "tickets-filters__control",
          name: "priority",
          defaultValue: ticketList.filters.applied.priority ?? "",
        },
        createElement("option", { value: "" }, "All priorities"),
        ...ticketList.filters.priorityOptions.map((priority) =>
          createElement("option", { key: priority, value: priority }, formatTicketListLabel(priority)),
        ),
      ),
    ),
    createElement(
      "label",
      { className: "tickets-filters__field" },
      createElement("span", { className: "tickets-filters__label" }, "Assignee"),
      createElement(
        "select",
        {
          className: "tickets-filters__control",
          name: "assignee",
          defaultValue: ticketList.filters.applied.assigneeMemberId ?? "",
        },
        createElement("option", { value: "" }, "All assignees"),
        ...ticketList.filters.assigneeOptions.map((assignee) =>
          createElement(
            "option",
            { key: assignee.memberId, value: assignee.memberId },
            assignee.displayName ?? assignee.email,
          ),
        ),
      ),
    ),
    createElement(
      "label",
      { className: "tickets-filters__field" },
      createElement("span", { className: "tickets-filters__label" }, "Sort"),
      createElement(
        "select",
        {
          className: "tickets-filters__control",
          name: "sort",
          defaultValue: ticketList.filters.applied.sort,
        },
        ...ticketListSortValues.map((sort) =>
          createElement("option", { key: sort, value: sort }, readTicketListSortLabel(sort)),
        ),
      ),
    ),
    createElement(
      "div",
      { className: "tickets-filters__actions" },
      createElement("button", { className: "tickets-filters__submit", type: "submit" }, "Apply"),
      createElement("a", { className: "tickets-filters__reset-link", href: ticketsPath }, "Reset"),
    ),
  );
}

function readTicketListSortLabel(sort: TicketListSort): string {
  switch (sort) {
    case "updated_asc":
      return "Oldest activity";
    case "priority_desc":
      return "Highest priority";
    case "updated_desc":
      return "Newest activity";
  }
}

function formatTicketListLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTicketCount(count: number): string {
  return `${count} ticket${count === 1 ? "" : "s"}`;
}

function renderTicketDetailScreen(options: {
  readonly workspaceSlug: string;
  readonly ticketId: string;
  readonly sessionBootstrap: PlaceholderScreenProps["sessionBootstrap"];
  readonly ticketDetail: PlaceholderScreenProps["ticketDetail"];
  readonly ticketDetailError: string | null;
  readonly ticketCommunicationSubmission: PlaceholderScreenProps["ticketCommunicationSubmission"];
  readonly ticketFieldEditSubmission: PlaceholderScreenProps["ticketFieldEditSubmission"];
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
    const composerSubmission = options.ticketCommunicationSubmission;
    const fieldEditSubmission =
      options.ticketFieldEditSubmission?.intent === "update-ticket-fields"
        ? options.ticketFieldEditSubmission
        : null;

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
          `Workspace: ${workspace.name}. Keep customer-safe updates and internal-only notes clearly separated while maintaining a fast daily update flow.`,
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
          { className: "ticket-detail-screen__card", id: "ticket-metadata" },
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
          renderTicketFieldEditor({
            action: detailPath,
            ticket: options.ticketDetail.ticket,
            editing: options.ticketDetail.editing,
            access,
            submission: fieldEditSubmission,
          }),
        ),
      ),
      createElement(
        "div",
        { className: "ticket-detail-screen__sections" },
        renderCommunicationSection({
          sectionId: "customer-visible-updates",
          title: "Customer-visible updates",
          visibilityLabel: "Customer-visible",
          description: "Post concise, customer-safe updates that communicate current standing without exposing internal-only context.",
          items: sections.customerVisibleUpdates,
          emptyBody: "No customer-facing updates have been posted yet.",
          submission:
            composerSubmission?.intent === "create-customer-update" ? composerSubmission : null,
          composer: access.canCreateCustomerUpdates
            ? {
                title: "Post customer update",
                description: "Visible to customer-facing workspace members who can access this ticket.",
                intent: "create-customer-update",
                action: detailPath,
                submitLabel: "Post customer update",
                fieldLabel: "Customer update",
                fieldName: "message",
                placeholder: "Summarize what changed, what is being investigated, and when the next update is expected.",
                helperText: "Customer-visible content only. Avoid staff-only notes, internal root-cause details, or sensitive troubleshooting context.",
              }
            : null,
          restrictedMessage: "You can review customer-visible updates here, but you cannot post new ones with your current role.",
        }),
        access.canViewInternalNotes
          ? renderCommunicationSection({
              sectionId: "internal-notes",
              title: "Internal notes",
              visibilityLabel: "Internal-only",
              description: "Capture staff-only investigation details, handoff notes, and operational context that must never appear in customer-facing updates.",
              items: sections.internalNotes ?? [],
              emptyBody: "No internal notes have been captured for this ticket yet.",
              submission:
                composerSubmission?.intent === "create-internal-note" ? composerSubmission : null,
              composer: access.canCreateInternalNotes
                ? {
                    title: "Add internal note",
                    description: "Internal notes stay hidden from customer-facing roles and should only capture staff-only context.",
                    intent: "create-internal-note",
                    action: detailPath,
                    submitLabel: "Save internal note",
                    fieldLabel: "Internal note",
                    fieldName: "message",
                    placeholder: "Capture staff-only investigation notes, blockers, or next steps.",
                    helperText: "Internal-only. This content should support staff coordination and must stay separate from customer-visible communication.",
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
          {
            title: "Comments / activity",
            visibilityLabel: "Workspace timeline",
            description:
              "Review customer updates, internal notes, comments, attachments, and field changes in one chronological feed so each meaningful mutation stays easy to trace.",
            items: sections.activityTimeline,
            emptyBody: "No visible timeline events are available for this ticket yet.",
          },
        ),
        renderAttachmentSection(
          {
            title: "Attachments",
            visibilityLabel: access.canViewAttachments ? "Read-only metadata" : "Protected",
            description: access.canViewAttachments
              ? "Files linked to this ticket stay grouped here with uploader, visibility, file type, and size details."
              : "Attachments are permission-aware and are not available to your current role.",
            items: sections.attachments,
            emptyBody: access.canViewAttachments
              ? "No attachment metadata has been captured for this ticket yet."
              : "Attachments are permission-aware and are not available to your current role.",
          },
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
  readonly sectionId: string;
  readonly title: string;
  readonly visibilityLabel: string;
  readonly description: string;
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
  readonly submission: PlaceholderScreenProps["ticketCommunicationSubmission"];
  readonly composer: {
    readonly title: string;
    readonly description: string;
    readonly intent: string;
    readonly action: string;
    readonly submitLabel: string;
    readonly fieldLabel: string;
    readonly fieldName: string;
    readonly placeholder: string;
    readonly helperText: string;
  } | null;
  readonly restrictedMessage: string;
}): ReactElement {
  return createElement(
    "section",
    {
      className: `ticket-detail-screen__section-card ticket-detail-screen__section-card--${options.sectionId}`,
      id: options.sectionId,
    },
    createElement("p", { className: "ticket-detail-screen__section-eyebrow" }, options.visibilityLabel),
    createElement("h3", { className: "ticket-detail-screen__card-title" }, options.title),
    createElement("p", { className: "ticket-detail-screen__section-description" }, options.description),
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
      ? renderComposer(options.composer, options.submission)
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

function renderActivitySection(options: {
  readonly title: string;
  readonly visibilityLabel: string;
  readonly description: string;
  readonly items: NonNullable<PlaceholderScreenProps["ticketDetail"]>["sections"]["activityTimeline"];
  readonly emptyBody: string;
}): ReactElement {
  const customerUpdateCount = options.items.filter((item) => item.kind === "customer_update").length;
  const internalNoteCount = options.items.filter((item) => item.kind === "internal_note").length;
  const commentCount = options.items.filter((item) => item.kind === "comment").length;
  const attachmentCount = options.items.filter((item) => item.kind === "attachment").length;
  const changeCount = options.items.filter((item) => item.kind === "field_change").length;

  return createElement(
    "section",
    { className: "ticket-detail-screen__section-card" },
    createElement("p", { className: "ticket-detail-screen__section-eyebrow" }, options.visibilityLabel),
    createElement("h3", { className: "ticket-detail-screen__card-title" }, options.title),
    createElement("p", { className: "ticket-detail-screen__section-description" }, options.description),
    options.items.length > 0
      ? createElement(
          "div",
           { className: "ticket-detail-screen__activity-summary" },
            renderSummaryPill("Updates", String(customerUpdateCount)),
            renderSummaryPill("Notes", String(internalNoteCount)),
            renderSummaryPill("Comments", String(commentCount)),
            renderSummaryPill("Files", String(attachmentCount)),
            renderSummaryPill("Field changes", String(changeCount)),
          )
      : null,
    options.items.length > 0
      ? createElement(
          "ol",
          { className: "ticket-detail-screen__timeline-list" },
          ...options.items.map((item) => renderActivityEntry(item)),
        )
      : createElement(EmptyStatePlaceholder, {
          title: "Nothing here yet",
          body: options.emptyBody,
        }),
  );
}

function renderAttachmentSection(options: {
  readonly title: string;
  readonly visibilityLabel: string;
  readonly description: string;
  readonly items: NonNullable<PlaceholderScreenProps["ticketDetail"]>["sections"]["attachments"];
  readonly emptyBody: string;
}): ReactElement {
  return createElement(
    "section",
    { className: "ticket-detail-screen__section-card" },
    createElement("p", { className: "ticket-detail-screen__section-eyebrow" }, options.visibilityLabel),
    createElement("h3", { className: "ticket-detail-screen__card-title" }, options.title),
    createElement("p", { className: "ticket-detail-screen__section-description" }, options.description),
    options.items.length > 0
      ? createElement(
          "ul",
          { className: "ticket-detail-screen__attachment-list" },
          ...options.items.map((item) =>
            createElement(
              "li",
              { key: item.id, className: "ticket-detail-screen__attachment-item" },
              createElement(
                "div",
                { className: "ticket-detail-screen__attachment-header" },
                createElement(
                  "a",
                  {
                    className: "ticket-detail-screen__attachment-link",
                    href: item.downloadPath,
                  },
                  item.filename,
                ),
                createElement(
                  "div",
                  { className: "ticket-detail-screen__attachment-badges" },
                  renderInlineBadge("Attachment", "attachment"),
                  renderInlineBadge(item.visibility === "internal" ? "Internal" : "Customer", item.visibility),
                  renderInlineBadge(formatFileSize(item.sizeBytes), "neutral"),
                ),
              ),
              createElement(
                "p",
                { className: "ticket-detail-screen__attachment-meta" },
                `${item.contentType} · Added ${formatUpdatedAt(item.createdAt)}`,
              ),
              createElement(
                "p",
                { className: "ticket-detail-screen__attachment-meta" },
                `Uploaded by ${item.uploadedBy.displayName ?? item.uploadedBy.email}`,
              ),
            ),
          ),
        )
      : createElement(EmptyStatePlaceholder, {
          title: "Nothing here yet",
          body: options.emptyBody,
        }),
  );
}

function renderActivityEntry(
  item: NonNullable<PlaceholderScreenProps["ticketDetail"]>["sections"]["activityTimeline"][number],
): ReactElement {
  if (item.kind === "customer_update" || item.kind === "internal_note" || item.kind === "comment") {
    const badgeLabel =
      item.kind === "customer_update"
        ? "Customer update"
        : item.kind === "internal_note"
          ? "Internal note"
          : item.visibility === "internal"
            ? "Internal comment"
            : "Customer comment";

    return renderTimelineEntry(
      item.id,
      item.message,
      item.createdAt,
      item.author,
      badgeLabel,
      item.updatedAt !== item.createdAt ? "Edited" : undefined,
    );
  }

  if (item.kind === "field_change") {
    return createElement(
      "li",
      { key: item.id, className: "ticket-detail-screen__timeline-item" },
      createElement(
        "div",
        { className: "ticket-detail-screen__timeline-meta" },
        renderInlineBadge("Ticket updated", "neutral"),
        createElement(
          "p",
          { className: "ticket-detail-screen__timeline-author" },
          item.author.displayName ?? item.author.email,
        ),
        createElement("p", { className: "ticket-detail-screen__timeline-date" }, formatUpdatedAt(item.createdAt)),
      ),
      createElement(
        "div",
        { className: "ticket-detail-screen__field-change-list" },
        ...item.changes.map((change) =>
          createElement(
            "p",
            { key: `${item.id}-${change.field}`, className: "ticket-detail-screen__timeline-detail" },
            `${change.label}: ${change.from ?? "Not set"} -> ${change.to ?? "Not set"}`,
          ),
        ),
      ),
    );
  }

  if (item.kind === "attachment") {
    return createElement(
      "li",
      { key: item.id, className: "ticket-detail-screen__timeline-item" },
      createElement(
        "div",
        { className: "ticket-detail-screen__timeline-meta" },
        renderInlineBadge("Attachment added", "attachment"),
        renderInlineBadge(item.visibility === "internal" ? "Internal" : "Customer", item.visibility),
        createElement(
          "p",
          { className: "ticket-detail-screen__timeline-author" },
          item.author.displayName ?? item.author.email,
        ),
        createElement("p", { className: "ticket-detail-screen__timeline-date" }, formatUpdatedAt(item.createdAt)),
      ),
      createElement(
        "a",
        {
          className: "ticket-detail-screen__attachment-link ticket-detail-screen__timeline-message",
          href: item.attachment.downloadPath,
        },
        item.attachment.filename,
      ),
      createElement(
        "p",
        { className: "ticket-detail-screen__timeline-detail" },
        `${item.attachment.contentType} · ${formatFileSize(item.attachment.sizeBytes)}`,
      ),
    );
  }

  throw new Error("Unsupported ticket activity entry.");
}

function renderTicketFieldEditor(options: {
  readonly action: string;
  readonly ticket: NonNullable<PlaceholderScreenProps["ticketDetail"]>["ticket"];
  readonly editing: NonNullable<PlaceholderScreenProps["ticketDetail"]>["editing"];
  readonly access: NonNullable<PlaceholderScreenProps["ticketDetail"]>["access"];
  readonly submission: PlaceholderScreenProps["ticketFieldEditSubmission"];
}): ReactElement {
  const canEditAnything =
    options.access.canUpdateTicketFields ||
    options.access.canAssignTickets ||
    options.access.canChangeTicketStatus;

  if (!canEditAnything) {
    return createElement(
      "p",
      { className: "ticket-detail-screen__composer-note" },
      "Ticket metadata is visible here, but your current role cannot change status, priority, assignee, or due date.",
    );
  }

  const feedbackId = "update-ticket-fields-feedback";
  const helperId = "update-ticket-fields-helper";
  const describedBy = options.submission ? `${helperId} ${feedbackId}` : helperId;
  const currentAssigneeId = options.ticket.assignee?.memberId ?? "";
  const currentDueDate = formatDateInputValue(options.ticket.dueDate);
  const draft = options.submission?.draft;

  return createElement(
    "form",
    {
      className: "ticket-detail-screen__composer ticket-detail-screen__composer--metadata",
      method: "post",
      action: options.action,
    },
    createElement("input", {
      type: "hidden",
      name: "intent",
      value: "update-ticket-fields",
    }),
    options.submission
      ? createElement(
          "div",
          {
            className:
              options.submission.status === "success"
                ? "ticket-detail-screen__composer-feedback ticket-detail-screen__composer-feedback--success"
                : "ticket-detail-screen__composer-feedback ticket-detail-screen__composer-feedback--error",
            id: feedbackId,
            role: options.submission.status === "success" ? "status" : "alert",
          },
          options.submission.message,
        )
      : null,
    createElement("h4", { className: "ticket-detail-screen__composer-title" }, "Update ticket details"),
    createElement(
      "p",
      { className: "ticket-detail-screen__composer-description" },
      "Keep the ticket operational by updating the core fields that drive queue state, ownership, and follow-up timing.",
    ),
    createElement(
      "div",
      { className: "ticket-detail-screen__field-grid" },
      renderFieldInput({
        label: "Status",
        input: createElement(
          "select",
          {
            className: "ticket-detail-screen__composer-input",
            name: "status",
            disabled: !options.access.canChangeTicketStatus,
            "aria-describedby": describedBy,
            "aria-invalid":
              options.submission?.status === "error" && draft?.status !== undefined ? true : undefined,
            defaultValue: draft?.status ?? options.ticket.status,
          },
          ...options.editing.statusOptions.map((status) =>
            createElement("option", { key: status, value: status }, status),
          ),
        ),
      }),
      renderFieldInput({
        label: "Priority",
        input: createElement(
          "select",
          {
            className: "ticket-detail-screen__composer-input",
            name: "priority",
            disabled: !options.access.canUpdateTicketFields,
            "aria-describedby": describedBy,
            "aria-invalid":
              options.submission?.status === "error" && draft?.priority !== undefined ? true : undefined,
            defaultValue: draft?.priority ?? options.ticket.priority,
          },
          ...options.editing.priorityOptions.map((priority) =>
            createElement("option", { key: priority, value: priority }, priority),
          ),
        ),
      }),
      renderFieldInput({
        label: "Assignee",
        input: createElement(
          "select",
          {
            className: "ticket-detail-screen__composer-input",
            name: "assigneeMemberId",
            disabled: !options.access.canAssignTickets,
            "aria-describedby": describedBy,
            defaultValue: draft?.assigneeMemberId ?? currentAssigneeId,
          },
          createElement("option", { value: "" }, "Unassigned"),
          ...options.editing.assigneeOptions.map((assignee) =>
            createElement(
              "option",
              { key: assignee.memberId, value: assignee.memberId },
              assignee.displayName ?? assignee.email,
            ),
          ),
        ),
      }),
      renderFieldInput({
        label: "Due date",
        input: createElement("input", {
          className: "ticket-detail-screen__composer-input",
          type: "date",
          name: "dueDate",
          disabled: !options.access.canUpdateTicketFields,
          "aria-describedby": describedBy,
          "aria-invalid":
            options.submission?.status === "error" && draft?.dueDate !== undefined ? true : undefined,
          defaultValue: draft?.dueDate ?? currentDueDate,
        }),
      }),
    ),
    createElement(
      "p",
      { className: "ticket-detail-screen__composer-helper", id: helperId },
      createTicketFieldEditorHelper(options.access),
    ),
    createElement(
      "div",
      { className: "ticket-detail-screen__composer-actions" },
      createElement(
        "button",
        { className: "ticket-detail-screen__composer-button", type: "submit" },
        "Save ticket details",
      ),
    ),
  );
}

function renderFieldInput(options: {
  readonly label: string;
  readonly input: ReactElement;
}): ReactElement {
  return createElement(
    "div",
    { className: "ticket-detail-screen__field" },
    createElement("label", { className: "ticket-detail-screen__composer-label" }, options.label),
    options.input,
  );
}

function createTicketFieldEditorHelper(
  access: NonNullable<PlaceholderScreenProps["ticketDetail"]>["access"],
): string {
  const restricted: string[] = [];

  if (!access.canChangeTicketStatus) {
    restricted.push("status");
  }

  if (!access.canUpdateTicketFields) {
    restricted.push("priority and due date");
  }

  if (!access.canAssignTickets) {
    restricted.push("assignee");
  }

  if (restricted.length === 0) {
    return "Changes are validated on save and recorded in the activity timeline.";
  }

  return `Editable fields stay enabled for your role. Locked here: ${restricted.join(", ")}.`;
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
  secondaryBadgeLabel?: string,
): ReactElement {
  return createElement(
    "li",
    { key, className: "ticket-detail-screen__timeline-item" },
    createElement(
      "div",
      { className: "ticket-detail-screen__timeline-meta" },
      badgeLabel
        ? renderInlineBadge(badgeLabel, badgeLabel.startsWith("Internal") ? "internal" : "customer")
        : null,
      secondaryBadgeLabel
        ? renderInlineBadge(secondaryBadgeLabel, "neutral")
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

function renderSummaryPill(label: string, value: string): ReactElement {
  return createElement(
    "div",
    { className: "ticket-detail-screen__summary-pill" },
    createElement("span", { className: "ticket-detail-screen__summary-pill-value" }, value),
    createElement("span", { className: "ticket-detail-screen__summary-pill-label" }, label),
  );
}

function renderInlineBadge(
  label: string,
  tone: "customer" | "internal" | "attachment" | "neutral",
): ReactElement {
  return createElement(
    "span",
    { className: `ticket-detail-screen__timeline-badge ticket-detail-screen__timeline-badge--${tone}` },
    label,
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
  readonly placeholder: string;
  readonly helperText: string;
}, submission: PlaceholderScreenProps["ticketCommunicationSubmission"]): ReactElement {
  const fieldId = `${options.intent}-${options.fieldName}`;
  const feedbackId = `${options.intent}-feedback`;
  const helperId = `${options.intent}-helper`;
  const describedByIds = submission ? `${helperId} ${feedbackId}` : helperId;

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
    submission
      ? createElement(
          "div",
          {
            className:
              submission.status === "success"
                ? "ticket-detail-screen__composer-feedback ticket-detail-screen__composer-feedback--success"
                : "ticket-detail-screen__composer-feedback ticket-detail-screen__composer-feedback--error",
            id: feedbackId,
            role: submission.status === "success" ? "status" : "alert",
          },
          submission.message,
        )
      : null,
    createElement("h4", { className: "ticket-detail-screen__composer-title" }, options.title),
    createElement("p", { className: "ticket-detail-screen__composer-description" }, options.description),
    createElement("label", { className: "ticket-detail-screen__composer-label", htmlFor: fieldId }, options.fieldLabel),
    createElement("textarea", {
      className: "ticket-detail-screen__composer-input",
      id: fieldId,
      name: options.fieldName,
      rows: 4,
      placeholder: options.placeholder,
      required: true,
      maxLength: 4000,
      "aria-invalid": submission?.status === "error" ? true : undefined,
      "aria-describedby": describedByIds,
      defaultValue: submission?.status === "error" ? submission.draftMessage : undefined,
    }),
    createElement(
      "p",
      { className: "ticket-detail-screen__composer-helper", id: helperId },
      options.helperText,
    ),
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

function formatDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : value;
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
