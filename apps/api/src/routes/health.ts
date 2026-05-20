import type { Hono } from "hono";

import type { ApiEnv } from "../lib/env";

export function registerHealthRoutes(app: Hono<{ Bindings: ApiEnv }>): void {
  app.get("/health", (context) => {
    return context.json({
      status: "ok",
      phase: "scaffold",
    });
  });
}
