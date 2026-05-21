import { describe, expect, it } from "vitest";

import {
  renderLoadedWebAppDocument,
  renderWebAppDocument,
  renderWebAppShell,
} from "./index.ts";
import { placeholderRouteModules } from "./routes/index.ts";

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
    expect(html).toContain("Required permission placeholder: workspace.view, tickets.view");
  });

  it("renders document-level placeholders for shared, unauthorized, and missing routes", () => {
    expect(renderWebAppDocument("/shared/demo-token")).toContain("Shared ticket view placeholder");
    expect(renderWebAppDocument("/not-authorized")).toContain("Not authorized");
    expect(renderWebAppDocument("/unknown/path")).toContain("Page not found");
  });

  it("renders the real workspace overview slice when data has been loaded", () => {
    const html = renderLoadedWebAppDocument({
      routeState: {
        kind: "workspace",
        pathname: "/workspaces/acme/overview",
        workspaceSlug: "acme",
        routeId: "workspace-overview",
        ticketId: null,
        route: placeholderRouteModules[0],
        access: "protected",
        authState: "pending",
        routeGuard: {
          strategy: "authenticated-workspace-membership",
          fallbackPath: "/not-authorized",
          requiredPermissions: ["workspace.view"],
        },
        authorization: {
          sessionState: "authenticated",
          permissionState: "authorized",
          missingPermissions: [],
        },
      },
      sessionBootstrap: {
        authenticated: true,
        user: {
          id: "usr_customer",
          email: "customer@example.com",
          displayName: "Customer User",
          userType: "customer",
        },
        session: {
          state: "authenticated",
          driver: "hybrid-friendly-placeholder",
          providerModel: "provider-agnostic",
          source: "cookie",
        },
        workspaces: [],
      },
      workspaceOverview: {
        workspace: {
          id: "wsp_acme",
          slug: "acme",
          name: "Acme Workspace",
          description: "Customer operations workspace",
          isDefault: true,
          tenant: {
            id: "ten_acme",
            name: "Acme Co",
            slug: "acme",
          },
        },
        summary: {
          activeMemberCount: 2,
        },
        membership: {
          role: "WorkspaceAdmin",
          memberStatus: "active",
        },
        access: {
          actorRole: "WorkspaceAdmin",
          accessPath: "workspace-membership",
          canViewMembers: true,
          canViewSettings: true,
        },
      },
      ticketList: null,
      ticketListError: null,
      ticketDetail: null,
      ticketDetailError: null,
    });

    expect(html).toContain("Acme Workspace");
    expect(html).toContain("Active members: 2");
    expect(html).toContain("Signed in as Customer User");
  });

  it("renders the real ticket list slice when data has been loaded", () => {
    const html = renderLoadedWebAppDocument({
      routeState: {
        kind: "workspace",
        pathname: "/workspaces/acme/tickets",
        workspaceSlug: "acme",
        routeId: "tickets",
        ticketId: null,
        route: placeholderRouteModules[1],
        access: "protected",
        authState: "pending",
        routeGuard: {
          strategy: "authenticated-workspace-membership",
          fallbackPath: "/not-authorized",
          requiredPermissions: ["workspace.view", "tickets.view"],
        },
        authorization: {
          sessionState: "authenticated",
          permissionState: "authorized",
          missingPermissions: [],
        },
      },
      sessionBootstrap: {
        authenticated: true,
        user: {
          id: "usr_customer",
          email: "customer@example.com",
          displayName: "Customer User",
          userType: "customer",
        },
        session: {
          state: "authenticated",
          driver: "hybrid-friendly-placeholder",
          providerModel: "provider-agnostic",
          source: "cookie",
        },
        workspaces: [
          {
            workspaceId: "wsp_acme",
            workspaceSlug: "acme",
            workspaceName: "Acme Workspace",
            tenantId: "ten_acme",
            tenantSlug: "acme",
            tenantName: "Acme Co",
            actorRole: "WorkspaceAdmin",
            membershipRole: "WorkspaceAdmin",
            memberStatus: "active",
            accessPath: "workspace-membership",
            grantedPermissions: ["workspace.view", "tickets.view"],
          },
        ],
      },
      workspaceOverview: null,
      ticketList: {
        workspace: {
          id: "wsp_acme",
          slug: "acme",
          name: "Acme Workspace",
        },
        items: [
          {
            id: "tic_001",
            ticketNumber: "TT-1",
            title: "Customer cannot upload billing CSV",
            status: "open",
            priority: "high",
            href: "/workspaces/acme/tickets/tic_001",
            updatedAt: "2025-01-10T09:00:00.000Z",
            assignee: {
              memberId: "mem_viewer",
              userId: "usr_viewer",
              displayName: "Viewer User",
              email: "viewer@example.com",
            },
          },
        ],
      },
      ticketListError: null,
      ticketDetail: null,
      ticketDetailError: null,
    });

    expect(html).toContain("Acme Workspace");
    expect(html).toContain("TT-1");
    expect(html).toContain("Customer cannot upload billing CSV");
    expect(html).toContain("Viewer User");
    expect(html).toContain("/workspaces/acme/tickets/tic_001");
  });

  it("renders the real ticket detail slice when data has been loaded", () => {
    const html = renderLoadedWebAppDocument({
      routeState: {
        kind: "workspace",
        pathname: "/workspaces/acme/tickets/tic_001",
        workspaceSlug: "acme",
        routeId: "tickets",
        ticketId: "tic_001",
        route: placeholderRouteModules[1],
        access: "protected",
        authState: "pending",
        routeGuard: {
          strategy: "authenticated-workspace-membership",
          fallbackPath: "/not-authorized",
          requiredPermissions: ["workspace.view", "tickets.view"],
        },
        authorization: {
          sessionState: "authenticated",
          permissionState: "authorized",
          missingPermissions: [],
        },
      },
      sessionBootstrap: {
        authenticated: true,
        user: {
          id: "usr_customer",
          email: "customer@example.com",
          displayName: "Customer User",
          userType: "customer",
        },
        session: {
          state: "authenticated",
          driver: "hybrid-friendly-placeholder",
          providerModel: "provider-agnostic",
          source: "cookie",
        },
        workspaces: [
          {
            workspaceId: "wsp_acme",
            workspaceSlug: "acme",
            workspaceName: "Acme Workspace",
            tenantId: "ten_acme",
            tenantSlug: "acme",
            tenantName: "Acme Co",
            actorRole: "WorkspaceAdmin",
            membershipRole: "WorkspaceAdmin",
            memberStatus: "active",
            accessPath: "workspace-membership",
            grantedPermissions: ["workspace.view", "tickets.view", "attachments.view"],
          },
        ],
      },
      workspaceOverview: null,
      ticketList: null,
      ticketListError: null,
      ticketDetail: {
        workspace: {
          id: "wsp_acme",
          slug: "acme",
          name: "Acme Workspace",
        },
        ticket: {
          id: "tic_001",
          ticketNumber: "TT-1",
          title: "Customer cannot upload billing CSV",
          description: "The customer billing CSV upload fails after validation completes.",
          status: "open",
          priority: "high",
          dueDate: "2025-01-17T17:00:00.000Z",
          updatedAt: "2025-01-10T09:00:00.000Z",
          assignee: {
            memberId: "mem_viewer",
            userId: "usr_viewer",
            displayName: "Viewer User",
            email: "viewer@example.com",
          },
        },
        summary: {
          currentStanding:
            "open priority high ticket assigned to Viewer User. Due 2025-01-17T17:00:00.000Z.",
        },
        sections: {
          customerVisibleUpdates: [
            {
              id: "upd_001",
              message: "We reproduced the upload problem and are working on a fix.",
              createdAt: "2025-01-09T13:00:00.000Z",
              updatedAt: "2025-01-09T13:00:00.000Z",
              author: {
                userId: "usr_support",
                displayName: "Support User",
                email: "support@example.com",
              },
            },
          ],
          internalNotes: null,
          commentsActivity: [
            {
              id: "cmt_001",
              kind: "comment",
              visibility: "customer",
              message: "We can reproduce this with the January export.",
              createdAt: "2025-01-09T15:00:00.000Z",
              updatedAt: "2025-01-09T15:00:00.000Z",
              author: {
                userId: "usr_customer",
                displayName: "Customer User",
                email: "customer@example.com",
              },
            },
          ],
          attachments: [
            {
              id: "att_001",
              visibility: "customer",
              filename: "billing-sample.csv",
              contentType: "text/csv",
              sizeBytes: 24576,
              createdAt: "2025-01-08T10:00:00.000Z",
            },
          ],
        },
        access: {
          actorRole: "WorkspaceAdmin",
          accessPath: "workspace-membership",
          canViewInternalNotes: false,
          canViewAttachments: true,
          canCreateInternalNotes: false,
          canCreateCustomerUpdates: true,
        },
      },
      ticketDetailError: null,
    });

    expect(html).toContain("Back to tickets");
    expect(html).toContain("Customer cannot upload billing CSV");
    expect(html).toContain("Due date:");
    expect(html).toContain("Current standing");
    expect(html).toContain("Viewer User");
    expect(html).toContain("Customer-visible updates");
    expect(html).toContain("We reproduced the upload problem");
    expect(html).toContain("Post customer update");
    expect(html).toContain("Customer-visible");
    expect(html).toContain("Internal-only");
    expect(html).toContain("Internal notes");
    expect(html).toContain("We can reproduce this with the January export.");
    expect(html).toContain("billing-sample.csv");
    expect(html).toContain("Attachments");
  });
});
