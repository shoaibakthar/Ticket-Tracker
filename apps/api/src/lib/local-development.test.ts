import { describe, expect, it } from "vitest";

import { shouldUseLocalDevelopmentFallback } from "./local-development";
import type { ApiEnv } from "./env";

function createApiEnv(overrides: Partial<ApiEnv> = {}): ApiEnv {
  const fallbackEnv: ApiEnv = {
    APP_ENV: "development",
    APP_BASE_URL: "http://localhost:8787",
    SESSION_DRIVER: "hybrid-friendly-placeholder",
    DB: {
      prepare() {
        return {
          bind() {
            return this;
          },
          async first() {
            return null;
          },
          async all() {
            return { results: [] };
          },
          async run() {
            return {};
          },
        };
      },
    },
    ATTACHMENTS: {
      async get() {
        return null;
      },
    },
  };

  return {
    ...fallbackEnv,
    ...overrides,
  };
}

describe("local development fallback boundary", () => {
  it("allows fallback only for development placeholder driver and missing-table errors", () => {
    expect(
      shouldUseLocalDevelopmentFallback(createApiEnv(), new Error("SQLITE_ERROR: no such table: ticket_updates")),
    ).toBe(true);
  });

  it("rejects fallback outside development or for non-table errors", () => {
    expect(
      shouldUseLocalDevelopmentFallback(
        createApiEnv({
          APP_ENV: "preview",
        }),
        new Error("SQLITE_ERROR: no such table: ticket_updates"),
      ),
    ).toBe(false);
    expect(shouldUseLocalDevelopmentFallback(createApiEnv(), new Error("database is locked"))).toBe(false);
  });
});
