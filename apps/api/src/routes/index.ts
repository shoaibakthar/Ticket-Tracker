import type { Hono } from "hono";

import type { ApiAppContext } from "../lib/context";
import { registerHealthRoutes } from "./health";
import { registerSessionRoutes } from "./session";
import { registerWorkspaceRoutes } from "./workspaces";

export function registerRoutes(app: Hono<ApiAppContext>): void {
  registerHealthRoutes(app);
  registerSessionRoutes(app);
  registerWorkspaceRoutes(app);
}
