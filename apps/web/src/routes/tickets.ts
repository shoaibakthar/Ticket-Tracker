import type { ReactElement } from "react";

import { EmptyStatePlaceholder } from "../components/states/empty-state.ts";
import { ErrorStatePlaceholder } from "../components/states/error-state.ts";
import { ScreenPlaceholder } from "../components/screen-placeholder.ts";
import { createElement } from "../lib/element.ts";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types.ts";

function renderTicketsScreen({
  workspaceSlug,
  sessionBootstrap,
  ticketList,
  ticketListError,
}: PlaceholderScreenProps): ReactElement {
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
                  createElement("strong", { className: "tickets-table__number" }, ticket.ticketNumber),
                  createElement("span", { className: "tickets-table__title" }, ticket.title),
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
    sessionBootstrap,
    workspaceOverview: null,
    ticketList,
    ticketListError,
    requiredPermissions: ticketsRoute.requiredPermissions,
    routePath: `/workspaces/${workspaceSlug}/tickets`,
    title: "Tickets",
    description: "The primary operational list for workspace-scoped ticket work, with safe separation from detail behavior added later.",
    primaryActionLabel: "Create Ticket",
    bodyTitle: "Ticket list shell",
    bodyDescription: "This rendered shell reserves space for a table-first ticket list, lightweight filters, and action entry points once real data is wired.",
  });
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
