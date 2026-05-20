import type { MiddlewareHandler } from "hono";

import { readApiVariables, type ApiEnv } from "../lib/env";

export const validateEnv: MiddlewareHandler<{ Bindings: ApiEnv }> = async (context, next) => {
  readApiVariables(context.env);
  await next();
};
