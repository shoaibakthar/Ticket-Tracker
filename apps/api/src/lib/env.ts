import { z } from "zod";

import type { D1Database } from "./d1";

export const apiRuntimeStages = ["development", "preview", "production"] as const;
export { sessionDriverValues } from "../../../../packages/auth/src/session";
import { sessionDriverValues } from "../../../../packages/auth/src/session";

export const apiVariableSchema = z.object({
  APP_ENV: z.enum(apiRuntimeStages),
  APP_BASE_URL: z.string().url(),
  SESSION_DRIVER: z.enum(sessionDriverValues),
  TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
});

export type CloudflareD1Binding = D1Database;

export interface CloudflareR2ObjectBody {
  arrayBuffer(): Promise<ArrayBufferLike>;
}

export interface CloudflareR2Binding {
  get(key: string): Promise<CloudflareR2ObjectBody | null>;
}

export interface ApiPlatformBindings {
  readonly DB: CloudflareD1Binding;
  readonly ATTACHMENTS: CloudflareR2Binding;
}

export type ApiVariables = z.infer<typeof apiVariableSchema>;
export type ApiEnv = ApiPlatformBindings & ApiVariables;

export interface ApiVariableSource {
  readonly APP_ENV: unknown;
  readonly APP_BASE_URL: unknown;
  readonly SESSION_DRIVER: unknown;
  readonly TURNSTILE_SITE_KEY?: unknown;
  readonly TURNSTILE_SECRET_KEY?: unknown;
}

export function readApiVariables(env: ApiVariableSource): ApiVariables {
  return apiVariableSchema.parse({
    APP_ENV: env.APP_ENV,
    APP_BASE_URL: env.APP_BASE_URL,
    SESSION_DRIVER: env.SESSION_DRIVER,
    TURNSTILE_SITE_KEY: env.TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET_KEY: env.TURNSTILE_SECRET_KEY,
  });
}

export const apiBindingNames = {
  database: "DB",
  attachments: "ATTACHMENTS",
} as const;

export const apiRuntimePlaceholder = {
  platform: "cloudflare-workers",
  sessionFlow: "app-backed-session-bootstrap",
  bindings: apiBindingNames,
} as const;
