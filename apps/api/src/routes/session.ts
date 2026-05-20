import type { Hono } from "hono";

import type { ApiEnv } from "../lib/env";

export function registerSessionRoutes(app: Hono<{ Bindings: ApiEnv }>): void {
  app.get("/session", (context) => {
    return context.json(
      {
        status: "placeholder",
        message: "Session handling will be implemented in the auth foundation phase.",
      },
      501,
    );
  });
}
