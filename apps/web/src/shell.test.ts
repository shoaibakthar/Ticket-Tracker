import { describe, expect, it } from "vitest";

import { renderWebAppShell } from "./index";
import { placeholderRouteModules } from "./routes";

describe("web app shell scaffold", () => {
  it("uses workspace-scoped route shapes for the primary navigation areas", () => {
    expect(placeholderRouteModules.map((route) => route.pathTemplate)).toEqual([
      "/workspaces/:workspaceSlug/overview",
      "/workspaces/:workspaceSlug/tickets",
      "/workspaces/:workspaceSlug/pages",
      "/workspaces/:workspaceSlug/files",
      "/workspaces/:workspaceSlug/members",
      "/workspaces/:workspaceSlug/share-links",
      "/workspaces/:workspaceSlug/settings",
    ]);
  });

  it("renders the sidebar, topbar, and placeholder states for the active screen", () => {
    const html = renderWebAppShell({
      workspaceSlug: "acme",
      activeRouteId: "tickets",
    });

    expect(html).toContain("Workspace / acme");
    expect(html).toContain("/workspaces/acme/tickets");
    expect(html).toContain("Create Ticket (placeholder)");
    expect(html).toContain("Loading");
    expect(html).toContain("Empty");
    expect(html).toContain("Error");
    expect(html).toContain("Share Links");
  });
});
