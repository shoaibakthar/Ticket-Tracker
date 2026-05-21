import { describe, expect, it } from "vitest";

import { applyRouteAuthorizationSnapshot, resolveAppRoute } from "./route-state.ts";

describe("app route state", () => {
  it("maps the root path to the product landing page", () => {
    expect(resolveAppRoute("/")).toEqual({
      kind: "marketing",
      pathname: "/",
      access: "public",
    });
  });

  it("matches documented workspace-scoped placeholder routes", () => {
    const route = resolveAppRoute("/workspaces/acme/share-links");

    expect(route).toMatchObject({
      kind: "workspace",
      workspaceSlug: "acme",
      routeId: "share-links",
      ticketId: null,
      access: "protected",
      authState: "pending",
    });
  });

  it("matches the workspace-scoped ticket detail route under the tickets section", () => {
    const route = resolveAppRoute("/workspaces/acme/tickets/tic_001");

    expect(route).toMatchObject({
      kind: "workspace",
      workspaceSlug: "acme",
      routeId: "tickets",
      ticketId: "tic_001",
      access: "protected",
      authState: "pending",
    });
  });

  it("matches the shared route shell separately from workspace routes", () => {
    expect(resolveAppRoute("/shared/demo-token")).toEqual({
      kind: "shared",
      pathname: "/shared/demo-token",
      token: "demo-token",
      access: "shared",
    });
  });

  it("keeps not-authorized distinct from not-found", () => {
    expect(resolveAppRoute("/not-authorized")).toEqual({
      kind: "not-authorized",
      pathname: "/not-authorized",
      access: "public",
      attemptedPath: null,
      missingPermissions: [],
    });

    expect(resolveAppRoute("/missing/route")).toEqual({
      kind: "not-found",
      pathname: "/missing/route",
      access: "public",
    });
  });

  it("turns workspace routes into not-authorized when a future auth snapshot lacks the required permission", () => {
    expect(
      applyRouteAuthorizationSnapshot(resolveAppRoute("/workspaces/acme/settings"), {
        sessionState: "authenticated",
        grantedPermissions: ["workspace.view"],
      }),
    ).toEqual({
      kind: "not-authorized",
      pathname: "/not-authorized",
      access: "public",
      attemptedPath: "/workspaces/acme/settings",
      missingPermissions: ["workspace.settings.view"],
    });
  });
});
