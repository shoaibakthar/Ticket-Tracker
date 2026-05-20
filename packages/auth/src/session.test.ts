import { describe, expect, it } from "vitest";

import { createAnonymousSession, resolveRequestSession, sessionStrategyPlaceholder } from "./session";

describe("session foundation", () => {
  it("returns an anonymous placeholder session when no identity headers are present", () => {
    expect(createAnonymousSession()).toEqual({
      state: "anonymous",
      driver: sessionStrategyPlaceholder.driver,
      source: "none",
    });
  });

  it("builds an authenticated customer session from placeholder headers", () => {
    expect(
      resolveRequestSession({
        sessionId: "sess_123",
        userId: "usr_123",
        userEmail: "customer@example.com",
        userDisplayName: "Customer User",
        userType: "customer",
        platformRole: null,
      }),
    ).toEqual({
      state: "authenticated",
      driver: sessionStrategyPlaceholder.driver,
      source: "placeholder-headers",
      sessionId: "sess_123",
      user: {
        id: "usr_123",
        email: "customer@example.com",
        displayName: "Customer User",
        userType: "customer",
        platformRole: null,
      },
    });
  });

  it("requires a platform role placeholder for internal users", () => {
    expect(
      resolveRequestSession({
        sessionId: null,
        userId: "usr_support",
        userEmail: "support@example.com",
        userDisplayName: "Support User",
        userType: "internal",
        platformRole: null,
      }),
    ).toEqual({
      state: "invalid",
      driver: sessionStrategyPlaceholder.driver,
      source: "placeholder-headers",
      reason: "internal_role_required",
    });
  });
});
