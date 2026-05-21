import type { Context, Hono } from "hono";
import { z } from "zod";

import { getRequestSession, getWorkspaceAccess, type ApiAppContext } from "../lib/context";
import {
  findLocalDevelopmentWorkspaceOverviewBySlug,
  findLocalDevelopmentWorkspaceTicketDetail,
  listLocalDevelopmentSessionBootstrapWorkspaces,
  listLocalDevelopmentWorkspaceTickets,
  shouldUseLocalDevelopmentFallback,
} from "../lib/local-development";
import { respondWithError } from "../lib/api-response";
import { hasPermission, isAuthenticatedSession } from "../../../../packages/auth/src/index";
import { requireWorkspacePermission } from "../middleware/require-workspace-permission";
import { resolveWorkspaceAccessContext } from "../middleware/resolve-workspace-access";
import { listSessionBootstrapWorkspaces } from "../lib/session-store";
import {
  createAuditEvent,
  createTicketCommunicationEntry,
  findWorkspaceOverviewBySlug,
  findWorkspaceTicketDetail,
  listWorkspaceTickets,
  updateTicketTimestamp,
} from "../lib/workspace-store";

const ticketCommunicationInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "A message is required.")
    .max(4_000, "Messages must stay under 4,000 characters."),
});

function createCurrentStandingSummary(options: {
  readonly status: string;
  readonly priority: string;
  readonly assigneeLabel: string;
  readonly dueDate: string | null;
}): string {
  const dueDateSummary = options.dueDate ? `Due ${options.dueDate}.` : "No due date is scheduled.";

  return `${options.status} priority ${options.priority.toLowerCase()} ticket assigned to ${options.assigneeLabel}. ${dueDateSummary}`;
}

function readStructuredText(value: string): string {
  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "";
  }

  const text = (parsed as { text?: unknown }).text;
  return typeof text === "string" ? text : "";
}

function createStructuredTextMessage(message: string): string {
  return JSON.stringify({ text: message });
}

function createRecordId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

async function listBootstrapWorkspaces(context: Context<ApiAppContext>) {
  const session = getRequestSession(context);

  if (session.state !== "authenticated") {
    return [];
  }

  try {
    return await listSessionBootstrapWorkspaces(context.env.DB, session);
  } catch (error) {
    if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
      throw error;
    }

    return listLocalDevelopmentSessionBootstrapWorkspaces(session);
  }
}

async function findWorkspaceOverview(context: Context<ApiAppContext>, workspaceSlug: string) {
  try {
    return await findWorkspaceOverviewBySlug(context.env.DB, workspaceSlug);
  } catch (error) {
    if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
      throw error;
    }

    return findLocalDevelopmentWorkspaceOverviewBySlug(workspaceSlug);
  }
}

async function listWorkspaceTicketRecords(
  context: Context<ApiAppContext>,
  workspaceId: string,
  options: {
    readonly includeInternalOnly: boolean;
  },
) {
  try {
    return await listWorkspaceTickets(context.env.DB, workspaceId, options);
  } catch (error) {
    if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
      throw error;
    }

    return listLocalDevelopmentWorkspaceTickets({
      workspaceId,
      includeInternalOnly: options.includeInternalOnly,
    });
  }
}

async function findWorkspaceTicketRecord(
  context: Context<ApiAppContext>,
  workspaceId: string,
  ticketId: string,
  options: {
    readonly includeInternalNotes: boolean;
    readonly includeAttachments: boolean;
  },
) {
  try {
    return await findWorkspaceTicketDetail(context.env.DB, workspaceId, ticketId, options);
  } catch (error) {
    if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
      throw error;
    }

    return findLocalDevelopmentWorkspaceTicketDetail({
      workspaceId,
      ticketId,
      includeInternalNotes: options.includeInternalNotes,
      includeAttachments: options.includeAttachments,
    });
  }
}

async function resolveAuthorizedTicketContext(context: Context<ApiAppContext>) {
  const workspaceAccess = getWorkspaceAccess(context);

  if (!workspaceAccess || workspaceAccess.status !== "authorized") {
    return {
      response: respondWithError(
        context,
        500,
        "internal_error",
        "Workspace access context should be authorized before workspace ticket routes run.",
      ),
    } as const;
  }

  const overview = await findWorkspaceOverview(context, workspaceAccess.workspaceSlug);

  if (!overview) {
    return {
      response: respondWithError(context, 404, "not_found", "Workspace ticket detail was not found."),
    } as const;
  }

  const canViewInternalNotes = hasPermission(workspaceAccess.actorRole, "tickets.view_internal_notes");
  const canViewAttachments = hasPermission(workspaceAccess.actorRole, "attachments.view");
  const ticketId = context.req.param("ticketId");

  if (!ticketId) {
    return {
      response: respondWithError(context, 500, "internal_error", "Ticket routes require a ticket identifier."),
    } as const;
  }

  const ticketDetail = await findWorkspaceTicketRecord(context, overview.workspace.id, ticketId, {
    includeInternalNotes: canViewInternalNotes,
    includeAttachments: canViewAttachments,
  });

  if (!ticketDetail) {
    return {
      response: respondWithError(context, 404, "not_found", "Ticket detail was not found."),
    } as const;
  }

  if (ticketDetail.ticket.visibility === "internal_only" && !canViewInternalNotes) {
    return {
      response: respondWithError(context, 404, "not_found", "Ticket detail was not found."),
    } as const;
  }

  return {
    workspaceAccess,
    overview,
    ticketDetail,
    canViewInternalNotes,
    canViewAttachments,
  } as const;
}

async function readTicketCommunicationInput(context: Context<ApiAppContext>) {
  const contentType = context.req.header("content-type") ?? "";
  let payload: unknown;

  try {
    if (contentType.includes("application/json")) {
      payload = await context.req.json();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      payload = await context.req.parseBody();
    } else {
      payload = {};
    }
  } catch {
    return {
      error: respondWithError(context, 400, "validation_error", "A valid request body is required."),
    } as const;
  }

  const result = ticketCommunicationInputSchema.safeParse(payload);

  if (!result.success) {
    return {
      error: respondWithError(
        context,
        400,
        "validation_error",
        result.error.issues[0]?.message ?? "A valid request body is required.",
      ),
    } as const;
  }

  return {
    data: result.data,
  } as const;
}

export function registerWorkspaceRoutes(app: Hono<ApiAppContext>): void {
  app.get("/api/v1/workspaces", async (context) => {
    const session = getRequestSession(context);

    if (session.state !== "authenticated") {
      return respondWithError(context, 401, "unauthorized", "A valid session is required for this route.");
    }

    return context.json({
        data: {
          items: await listBootstrapWorkspaces(context),
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

      const overview = await findWorkspaceOverview(context, workspaceAccess.workspaceSlug);

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

      const overview = await findWorkspaceOverview(context, workspaceAccess.workspaceSlug);

      if (!overview) {
        return respondWithError(context, 404, "not_found", "Workspace ticket list was not found.");
      }

      const ticketList = await listWorkspaceTicketRecords(context, overview.workspace.id, {
        includeInternalOnly: hasPermission(workspaceAccess.actorRole, "tickets.view_internal_notes"),
      });

      return context.json({
        data: {
          workspace: {
            id: overview.workspace.id,
            slug: overview.workspace.slug,
            name: overview.workspace.name,
          },
          items: ticketList.items.map((ticket) => ({
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            updatedAt: ticket.updatedAt,
            assignee: ticket.assignee,
          })),
        },
      });
    },
  );

  app.get(
    "/api/v1/workspaces/:workspaceSlug/tickets/:ticketId",
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
          "Workspace access context should be authorized before workspace ticket detail rendering.",
        );
      }

      const overview = await findWorkspaceOverview(context, workspaceAccess.workspaceSlug);

      if (!overview) {
        return respondWithError(context, 404, "not_found", "Workspace ticket detail was not found.");
      }

      const ticketDetail = await findWorkspaceTicketRecord(context, overview.workspace.id, context.req.param("ticketId"), {
        includeInternalNotes: hasPermission(workspaceAccess.actorRole, "tickets.view_internal_notes"),
        includeAttachments: hasPermission(workspaceAccess.actorRole, "attachments.view"),
      });

      if (!ticketDetail) {
        return respondWithError(context, 404, "not_found", "Ticket detail was not found.");
      }

      const canViewInternalNotes = hasPermission(workspaceAccess.actorRole, "tickets.view_internal_notes");
      const canViewAttachments = hasPermission(workspaceAccess.actorRole, "attachments.view");

      if (ticketDetail.ticket.visibility === "internal_only" && !canViewInternalNotes) {
        return respondWithError(context, 404, "not_found", "Ticket detail was not found.");
      }

      return context.json({
        data: {
          workspace: {
            id: overview.workspace.id,
            slug: overview.workspace.slug,
            name: overview.workspace.name,
          },
          ticket: {
            id: ticketDetail.ticket.id,
            ticketNumber: ticketDetail.ticket.ticketNumber,
            title: ticketDetail.ticket.title,
            description: ticketDetail.ticket.description,
            status: ticketDetail.ticket.status,
            priority: ticketDetail.ticket.priority,
            dueDate: ticketDetail.ticket.dueDate,
            updatedAt: ticketDetail.ticket.updatedAt,
            assignee: ticketDetail.ticket.assignee,
          },
          summary: {
            currentStanding: createCurrentStandingSummary({
              status: ticketDetail.ticket.status,
              priority: ticketDetail.ticket.priority,
              assigneeLabel: ticketDetail.ticket.assignee
                ? ticketDetail.ticket.assignee.displayName ?? ticketDetail.ticket.assignee.email
                : "Unassigned",
              dueDate: ticketDetail.ticket.dueDate,
            }),
          },
          sections: {
            customerVisibleUpdates: ticketDetail.sections.customerVisibleUpdates.map((entry) => ({
              id: entry.id,
              message: readStructuredText(entry.messageJson),
              createdAt: entry.createdAt,
              updatedAt: entry.updatedAt,
              author: entry.author,
            })),
            internalNotes: canViewInternalNotes
              ? ticketDetail.sections.internalNotes.map((entry) => ({
                  id: entry.id,
                  message: readStructuredText(entry.messageJson),
                  createdAt: entry.createdAt,
                  updatedAt: entry.updatedAt,
                  author: entry.author,
                }))
              : null,
            commentsActivity: ticketDetail.sections.commentsActivity.map((entry) => ({
              id: entry.id,
              kind: "comment",
              visibility: entry.visibility === "internal" ? "internal" : "customer",
              message: readStructuredText(entry.bodyJson),
              createdAt: entry.createdAt,
              updatedAt: entry.updatedAt,
              author: entry.author,
            })),
            attachments: ticketDetail.sections.attachments.map((attachment) => ({
              id: attachment.id,
              visibility: attachment.visibility === "internal" ? "internal" : "customer",
              filename: attachment.filename,
              contentType: attachment.contentType,
              sizeBytes: attachment.sizeBytes,
              createdAt: attachment.createdAt,
            })),
          },
          access: {
            actorRole: workspaceAccess.actorRole,
            accessPath: workspaceAccess.accessPath,
            canViewInternalNotes,
            canViewAttachments,
            canCreateInternalNotes: hasPermission(workspaceAccess.actorRole, "tickets.create_internal_notes"),
            canCreateCustomerUpdates: hasPermission(workspaceAccess.actorRole, "tickets.create_customer_updates"),
          },
        },
      });
    },
  );

  app.post(
    "/api/v1/workspaces/:workspaceSlug/tickets/:ticketId/internal-notes",
    resolveWorkspaceAccessContext,
    requireWorkspacePermission("workspace.view"),
    requireWorkspacePermission("tickets.view"),
    requireWorkspacePermission("tickets.create_internal_notes"),
    async (context) => {
      const ticketContext = await resolveAuthorizedTicketContext(context);

      if ("response" in ticketContext) {
        return ticketContext.response;
      }

      const input = await readTicketCommunicationInput(context);

      if ("error" in input) {
        return input.error;
      }

      const timestamp = new Date().toISOString();
      const entryId = createRecordId("upd");
      const requestSession = getRequestSession(context);

      if (!isAuthenticatedSession(requestSession)) {
        return respondWithError(context, 500, "internal_error", "Authenticated mutations require a resolved user session.");
      }

      await createTicketCommunicationEntry(context.env.DB, {
        id: entryId,
        ticketId: ticketContext.ticketDetail.ticket.id,
        authorUserId: requestSession.user.id,
        visibility: "internal",
        messageJson: createStructuredTextMessage(input.data.message),
        createdAt: timestamp,
      });
      await updateTicketTimestamp(context.env.DB, ticketContext.ticketDetail.ticket.id, timestamp);
      await createAuditEvent(context.env.DB, {
        id: createRecordId("aud"),
        actorUserId: requestSession.user.id,
        actorType: requestSession.user.userType === "internal" ? "internal_user" : "customer_user",
        workspaceId: ticketContext.overview.workspace.id,
        resourceType: "ticket_update",
        resourceId: entryId,
        action: "ticket.internal_note.created",
        metadataJson: JSON.stringify({
          ticketId: ticketContext.ticketDetail.ticket.id,
          ticketNumber: ticketContext.ticketDetail.ticket.ticketNumber,
          visibility: "internal",
        }),
        createdAt: timestamp,
      });

      return context.json(
        {
          data: {
            entry: {
              id: entryId,
              message: input.data.message,
              createdAt: timestamp,
              updatedAt: timestamp,
              visibility: "internal",
            },
          },
        },
        201,
      );
    },
  );

  app.post(
    "/api/v1/workspaces/:workspaceSlug/tickets/:ticketId/updates",
    resolveWorkspaceAccessContext,
    requireWorkspacePermission("workspace.view"),
    requireWorkspacePermission("tickets.view"),
    requireWorkspacePermission("tickets.create_customer_updates"),
    async (context) => {
      const ticketContext = await resolveAuthorizedTicketContext(context);

      if ("response" in ticketContext) {
        return ticketContext.response;
      }

      const input = await readTicketCommunicationInput(context);

      if ("error" in input) {
        return input.error;
      }

      const timestamp = new Date().toISOString();
      const entryId = createRecordId("upd");
      const requestSession = getRequestSession(context);

      if (!isAuthenticatedSession(requestSession)) {
        return respondWithError(context, 500, "internal_error", "Authenticated mutations require a resolved user session.");
      }

      await createTicketCommunicationEntry(context.env.DB, {
        id: entryId,
        ticketId: ticketContext.ticketDetail.ticket.id,
        authorUserId: requestSession.user.id,
        visibility: "customer",
        messageJson: createStructuredTextMessage(input.data.message),
        createdAt: timestamp,
      });
      await updateTicketTimestamp(context.env.DB, ticketContext.ticketDetail.ticket.id, timestamp);
      await createAuditEvent(context.env.DB, {
        id: createRecordId("aud"),
        actorUserId: requestSession.user.id,
        actorType: requestSession.user.userType === "internal" ? "internal_user" : "customer_user",
        workspaceId: ticketContext.overview.workspace.id,
        resourceType: "ticket_update",
        resourceId: entryId,
        action: "ticket.customer_update.created",
        metadataJson: JSON.stringify({
          ticketId: ticketContext.ticketDetail.ticket.id,
          ticketNumber: ticketContext.ticketDetail.ticket.ticketNumber,
          visibility: "customer",
        }),
        createdAt: timestamp,
      });

      return context.json(
        {
          data: {
            entry: {
              id: entryId,
              message: input.data.message,
              createdAt: timestamp,
              updatedAt: timestamp,
              visibility: "customer",
            },
          },
        },
        201,
      );
    },
  );
}
