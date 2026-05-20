import { describe, expect, it } from "vitest";

import { loadAppRouteData } from "./app-loader.ts";

describe("app route data loader", () => {
  it("loads session bootstrap and overview data for the workspace overview route", async () => {
    const loaded = await loadAppRouteData("/workspaces/acme/overview", {
      apiBaseUrl: "http://api.example.test",
      fetchImpl: async (input) => {
        const url = typeof input === "string" ? input : String(input);

        if (url.endsWith("/api/v1/session")) {
          return createJsonResponse({
            data: {
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
                  grantedPermissions: ["workspace.view", "workspace.members.view", "workspace.settings.view"],
                },
              ],
            },
          });
        }

        return createJsonResponse({
          data: {
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
        });
      },
    });

    expect(loaded.routeState.kind).toBe("workspace");
    expect(loaded.sessionBootstrap?.authenticated).toBe(true);
    expect(loaded.workspaceOverview?.workspace.name).toBe("Acme Workspace");
    expect(loaded.ticketList).toBeNull();
  });

  it("maps unauthorized workspace access into the not-authorized route state", async () => {
    const loaded = await loadAppRouteData("/workspaces/acme/overview", {
      apiBaseUrl: "http://api.example.test",
      fetchImpl: async (input) => {
        const url = typeof input === "string" ? input : String(input);

        if (url.endsWith("/api/v1/session")) {
          return createJsonResponse({
            data: {
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
          });
        }

        return createJsonResponse(
          {
            error: {
              code: "forbidden",
              message: "The current session cannot access this workspace route.",
            },
          },
          403,
        );
      },
    });

    expect(loaded.routeState).toEqual({
      kind: "not-authorized",
      pathname: "/not-authorized",
      access: "public",
      attemptedPath: "/workspaces/acme/overview",
      missingPermissions: ["workspace.view"],
    });
    expect(loaded.workspaceOverview).toBeNull();
    expect(loaded.ticketList).toBeNull();
  });

  it("loads the workspace ticket list for the tickets route", async () => {
    const loaded = await loadAppRouteData("/workspaces/acme/tickets", {
      apiBaseUrl: "http://api.example.test",
      fetchImpl: async (input) => {
        const url = typeof input === "string" ? input : String(input);

        if (url.endsWith("/api/v1/session")) {
          return createJsonResponse({
            data: {
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
          });
        }

        return createJsonResponse({
          data: {
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
        });
      },
    });

    expect(loaded.routeState.kind).toBe("workspace");
    expect(loaded.ticketList?.items).toHaveLength(1);
    expect(loaded.ticketList?.items[0]?.ticketNumber).toBe("TT-1");
    expect(loaded.ticketListError).toBeNull();
  });

  it("keeps the tickets route and exposes an error state when the ticket API fails", async () => {
    const loaded = await loadAppRouteData("/workspaces/acme/tickets", {
      apiBaseUrl: "http://api.example.test",
      fetchImpl: async (input) => {
        const url = typeof input === "string" ? input : String(input);

        if (url.endsWith("/api/v1/session")) {
          return createJsonResponse({
            data: {
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
          });
        }

        return createJsonResponse({ error: { code: "internal_error", message: "boom" } }, 500);
      },
    });

    expect(loaded.routeState.kind).toBe("workspace");
    expect(loaded.ticketList).toBeNull();
    expect(loaded.ticketListError).toBe("Unable to load tickets for this workspace.");
  });
});

function createJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}
