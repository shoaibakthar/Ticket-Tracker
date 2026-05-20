import type { Hono } from "hono";

import { getRequestSession, getWorkspaceAccess, type ApiAppContext } from "../lib/context";
import { respondWithError } from "../lib/api-response";
import { hasPermission } from "../../../../packages/auth/src/index";
import { requireWorkspacePermission } from "../middleware/require-workspace-permission";
import { resolveWorkspaceAccessContext } from "../middleware/resolve-workspace-access";
import { listSessionBootstrapWorkspaces } from "../lib/session-store";
import { findWorkspaceOverviewBySlug, listWorkspaceTickets } from "../lib/workspace-store";

export function registerWorkspaceRoutes(app: Hono<ApiAppContext>): void {
  app.get("/api/v1/workspaces", async (context) => {
    const session = getRequestSession(context);

    if (session.state !== "authenticated") {
      return respondWithError(context, 401, "unauthorized", "A valid session is required for this route.");
    }

    return context.json({
      data: {
        items: await listSessionBootstrapWorkspaces(context.env.DB, session),
      },
    });
  });

  app.get(
    "/api/v1/workspaces/:workspaceSlug/overview",
    resolveWorkspaceAccessContext,
    requireWorkspacePermission("workspace.view"),
    async (context) => {
      const workspaceAccess = getWorkspaceAccess(context);

      if (!workspaceAccess || workspaceAccess.status !== "authorized") {
        return respondWithError(
          context,
          500,
          "internal_error",
          "Workspace access context should be authorized before workspace overview rendering.",
        );
      }

      const overview = await findWorkspaceOverviewBySlug(context.env.DB, workspaceAccess.workspaceSlug);

      if (!overview) {
        return respondWithError(context, 404, "not_found", "Workspace overview was not found.");
      }

      return context.json({
        data: {
          workspace: overview.workspace,
          summary: overview.summary,
          membership: workspaceAccess.membership
            ? {
                role: workspaceAccess.membership.role,
                memberStatus: workspaceAccess.membership.memberStatus,
              }
            : null,
          access: {
            actorRole: workspaceAccess.actorRole,
            accessPath: workspaceAccess.accessPath,
            canViewMembers: hasPermission(workspaceAccess.actorRole, "workspace.members.view"),
            canViewSettings: hasPermission(workspaceAccess.actorRole, "workspace.settings.view"),
          },
        },
      });
    },
  );

  app.get(
    "/api/v1/workspaces/:workspaceSlug/tickets",
    resolveWorkspaceAccessContext,
    requireWorkspacePermission("workspace.view"),
    requireWorkspacePermission("tickets.view"),
    async (context) => {
      const workspaceAccess = getWorkspaceAccess(context);

      if (!workspaceAccess || workspaceAccess.status !== "authorized") {
        return respondWithError(
          context,
          500,
          "internal_error",
          "Workspace access context should be authorized before workspace ticket list rendering.",
        );
      }

      const overview = await findWorkspaceOverviewBySlug(context.env.DB, workspaceAccess.workspaceSlug);

      if (!overview) {
        return respondWithError(context, 404, "not_found", "Workspace ticket list was not found.");
      }

      const ticketList = await listWorkspaceTickets(context.env.DB, overview.workspace.id);

      return context.json({
        data: {
          workspace: {
            id: overview.workspace.id,
            slug: overview.workspace.slug,
            name: overview.workspace.name,
          },
          items: ticketList.items,
        },
      });
    },
  );
}
