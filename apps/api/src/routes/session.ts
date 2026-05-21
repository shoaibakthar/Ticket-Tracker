import type { Hono } from "hono";

import { sessionStrategyPlaceholder } from "../../../../packages/auth/src/index";
import { getRequestSession, type ApiAppContext } from "../lib/context";
import {
  listLocalDevelopmentSessionBootstrapWorkspaces,
  shouldUseLocalDevelopmentFallback,
} from "../lib/local-development";
import type { SessionBootstrapWorkspaceSummary } from "../lib/session-store";
import { listSessionBootstrapWorkspaces } from "../lib/session-store";

export function registerSessionRoutes(app: Hono<ApiAppContext>): void {
  app.get("/api/v1/session", async (context) => {
    const session = getRequestSession(context);
    const authenticated = session.state === "authenticated";
    let workspaces: readonly SessionBootstrapWorkspaceSummary[] = [];

    if (authenticated) {
      try {
        workspaces = await listSessionBootstrapWorkspaces(context.env.DB, session);
      } catch (error) {
        if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
          throw error;
        }

        workspaces = listLocalDevelopmentSessionBootstrapWorkspaces(session);
      }
    }

    return context.json({
      data: {
        authenticated,
        user: authenticated
          ? {
              id: session.user.id,
              email: session.user.email,
              displayName: session.user.displayName,
              userType: session.user.userType,
            }
          : null,
        session: {
          state: session.state,
          driver: sessionStrategyPlaceholder.driver,
          providerModel: sessionStrategyPlaceholder.providerModel,
          source: session.source,
        },
        workspaces,
      },
    });
  });
}
