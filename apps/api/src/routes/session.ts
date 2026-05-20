import type { Hono } from "hono";

import { sessionStrategyPlaceholder } from "../../../../packages/auth/src/index";
import { getRequestSession, type ApiAppContext } from "../lib/context";
import { listSessionBootstrapWorkspaces } from "../lib/session-store";

export function registerSessionRoutes(app: Hono<ApiAppContext>): void {
  app.get("/api/v1/session", async (context) => {
    const session = getRequestSession(context);
    const authenticated = session.state === "authenticated";
    const workspaces = authenticated
      ? await listSessionBootstrapWorkspaces(context.env.DB, session)
      : [];

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
