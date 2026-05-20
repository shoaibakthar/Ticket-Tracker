import type { Hono } from "hono";

import type { ApiAppContext } from "../lib/context";

export function registerHealthRoutes(app: Hono<ApiAppContext>): void {
  app.get("/health", (context) => {
    return context.json({
      status: "ok",
      phase: "auth-foundation",
    });
  });
}
