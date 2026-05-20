import type { MiddlewareHandler } from "hono";

import type { ApiAppContext } from "../lib/context";
import { readApiVariables } from "../lib/env";

export const validateEnv: MiddlewareHandler<ApiAppContext> = async (context, next) => {
  context.set("apiVariables", readApiVariables(context.env));
  context.set("requestSession", null);
  context.set("workspaceAccess", null);
  await next();
};
