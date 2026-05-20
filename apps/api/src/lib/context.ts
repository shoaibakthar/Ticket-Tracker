import type { Context } from "hono";

import {
  createAnonymousSession,
  type RequestSession,
  type WorkspaceAccessContext,
} from "../../../../packages/auth/src/index";
import type { ApiEnv, ApiVariables } from "./env";

export interface ApiContextVariables {
  readonly apiVariables: ApiVariables | null;
  readonly requestSession: RequestSession | null;
  readonly workspaceAccess: WorkspaceAccessContext | null;
}

export interface ApiAppContext {
  readonly Bindings: ApiEnv;
  readonly Variables: ApiContextVariables;
}

export function getRequestSession(context: Context<ApiAppContext>): RequestSession {
  return context.get("requestSession") ?? createAnonymousSession();
}

export function getWorkspaceAccess(context: Context<ApiAppContext>): WorkspaceAccessContext | null {
  return context.get("workspaceAccess");
}
