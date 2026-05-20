import type { MiddlewareHandler } from "hono";

import { envSchema, type ApiEnv } from "../lib/env";

export const validateEnv: MiddlewareHandler<{ Bindings: ApiEnv }> = async (context, next) => {
  envSchema.parse(context.env);
  await next();
};
