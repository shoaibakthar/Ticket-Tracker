import type { ReactElement } from "react";

import { ScreenPlaceholder } from "../components/screen-placeholder";
import type { PlaceholderRouteModule, PlaceholderScreenProps } from "../navigation/types";

function renderTicketsScreen({ workspaceSlug }: PlaceholderScreenProps): ReactElement {
  return ScreenPlaceholder({
    workspaceSlug,
    routePath: `/workspaces/${workspaceSlug}/tickets`,
    title: "Tickets",
    description: "The primary operational list for workspace-scoped ticket work, with safe separation from detail behavior added later.",
    primaryActionLabel: "Create Ticket",
    bodyTitle: "Ticket list shell",
    bodyDescription: "This rendered shell reserves space for a table-first ticket list, lightweight filters, and action entry points once real data is wired.",
  });
}

export const ticketsRoute: PlaceholderRouteModule = {
  id: "tickets",
  pathTemplate: "/workspaces/:workspaceSlug/tickets",
  title: "Tickets",
  summary: "Show the workspace ticket list with room for table-based operations later.",
  navigationLabel: "Tickets",
  placeholder: true,
  buildPath: (workspaceSlug) => `/workspaces/${workspaceSlug}/tickets`,
  renderScreen: renderTicketsScreen,
};
