import type { Hono } from "hono";

import type { ApiEnv } from "../lib/env";
import { registerHealthRoutes } from "./health";
import { registerSessionRoutes } from "./session";

export function registerRoutes(app: Hono<{ Bindings: ApiEnv }>): void {
  registerHealthRoutes(app);
  registerSessionRoutes(app);
}
