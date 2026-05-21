import type { Context, Hono } from "hono";
import { z } from "zod";

import { getRequestSession, getWorkspaceAccess, type ApiAppContext } from "../lib/context";
import {
  createLocalDevelopmentAuditEvent,
  createLocalDevelopmentTicketCommunicationEntry,
  findLocalDevelopmentWorkspaceAttachmentRecord,
  findLocalDevelopmentWorkspaceOverviewBySlug,
  findLocalDevelopmentWorkspaceTicketDetail,
  listLocalDevelopmentWorkspaceAssignableMembers,
  listLocalDevelopmentSessionBootstrapWorkspaces,
  listLocalDevelopmentWorkspaceTickets,
  readLocalDevelopmentAttachmentBody,
  shouldUseLocalDevelopmentFallback,
  updateLocalDevelopmentTicketFields,
  updateLocalDevelopmentTicketTimestamp,
} from "../lib/local-development";
import { respondWithError } from "../lib/api-response";
import { hasPermission, isAuthenticatedSession } from "../../../../packages/auth/src/index";
import type { Role } from "../../../../packages/auth/src/roles";
import {
  ticketListSortValues,
  ticketPriorityValues,
  ticketStatusValues,
  type TicketListSort,
} from "../../../../packages/types/src/index";
import { requireWorkspacePermission } from "../middleware/require-workspace-permission";
import { resolveWorkspaceAccessContext } from "../middleware/resolve-workspace-access";
import { listSessionBootstrapWorkspaces } from "../lib/session-store";
import {
  buildAllowedTicketPriorityValues,
  buildAllowedTicketStatusValues,
  createAuditEvent,
  createTicketCommunicationEntry,
  findWorkspaceAttachmentAccessRecord,
  findWorkspaceOverviewBySlug,
  findWorkspaceTicketDetail,
  listWorkspaceAssignableMembers,
  listWorkspaceTickets,
  type TicketFieldChangeRecord,
  updateTicketTimestamp,
  updateTicketFields,
} from "../lib/workspace-store";

const ticketCommunicationInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "A message is required.")
    .max(4_000, "Messages must stay under 4,000 characters."),
});

const ticketFieldDatePattern = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/;
const defaultTicketListSort: TicketListSort = "updated_desc";
const ticketListQuerySchema = z
  .object({
    status: z.string().trim().max(80).optional(),
    priority: z.string().trim().max(80).optional(),
    assignee: z.string().trim().max(80).optional(),
    q: z.string().trim().max(120).optional(),
    sort: z.enum(ticketListSortValues).optional().default(defaultTicketListSort),
  })
  .transform((input) => ({
    status: readOptionalQueryValue(input.status),
    priority: readOptionalQueryValue(input.priority),
    assigneeMemberId: readOptionalQueryValue(input.assignee),
    q: readOptionalQueryValue(input.q),
    sort: input.sort,
  }));

function createCurrentStandingSummary(options: {
  readonly status: string;
  readonly priority: string;
  readonly assigneeLabel: string;
  readonly dueDate: string | null;
}): string {
  const dueDateSummary = options.dueDate ? `Due ${options.dueDate}.` : "No due date is scheduled.";

  return `${options.status} priority ${options.priority.toLowerCase()} ticket assigned to ${options.assigneeLabel}. ${dueDateSummary}`;
}

function readOptionalQueryValue(value: string | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
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

function compareIsoTimestampsDescending(left: string, right: string): number {
  return right.localeCompare(left);
}

type TicketActivityResponseEntry =
  | {
      readonly id: string;
      readonly kind: "customer_update" | "internal_note" | "comment";
      readonly visibility: "customer" | "internal";
      readonly message: string;
      readonly createdAt: string;
      readonly updatedAt: string;
      readonly author: {
        readonly userId: string;
        readonly displayName: string | null;
        readonly email: string;
      };
    }
  | {
      readonly id: string;
      readonly kind: "attachment";
      readonly visibility: "customer" | "internal";
      readonly createdAt: string;
      readonly updatedAt: string;
      readonly author: {
        readonly userId: string;
        readonly displayName: string | null;
        readonly email: string;
      };
      readonly attachment: {
        readonly id: string;
        readonly visibility: "customer" | "internal";
        readonly filename: string;
        readonly downloadPath: string;
        readonly contentType: string;
        readonly sizeBytes: number;
        readonly createdAt: string;
        readonly uploadedBy: {
          readonly userId: string;
          readonly displayName: string | null;
          readonly email: string;
        };
      };
    }
  | {
      readonly id: string;
      readonly kind: "field_change";
      readonly createdAt: string;
      readonly updatedAt: string;
      readonly author: {
        readonly userId: string;
        readonly displayName: string | null;
        readonly email: string;
      };
      readonly changes: readonly TicketFieldChangeRecord["changes"][number][];
    };

function buildTicketActivityTimeline(options: {
  readonly workspaceSlug: string;
  readonly customerVisibleUpdates: readonly {
    readonly id: string;
    readonly messageJson: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly author: {
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    };
  }[];
  readonly internalNotes: readonly {
    readonly id: string;
    readonly messageJson: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly author: {
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    };
  }[];
  readonly comments: readonly {
    readonly id: string;
    readonly visibility: string;
    readonly bodyJson: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly author: {
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    };
  }[];
  readonly attachments: readonly {
    readonly id: string;
    readonly visibility: string;
    readonly filename: string;
    readonly contentType: string;
    readonly sizeBytes: number;
    readonly createdAt: string;
    readonly uploadedBy: {
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    };
  }[];
  readonly fieldChanges: readonly TicketFieldChangeRecord[];
}): readonly TicketActivityResponseEntry[] {
  const customerUpdates = options.customerVisibleUpdates.map((entry) => ({
    id: entry.id,
    kind: "customer_update" as const,
    visibility: "customer" as const,
    message: readStructuredText(entry.messageJson),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    author: entry.author,
  }));
  const internalNotes = options.internalNotes.map((entry) => ({
    id: entry.id,
    kind: "internal_note" as const,
    visibility: "internal" as const,
    message: readStructuredText(entry.messageJson),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    author: entry.author,
  }));
  const comments = options.comments.map((entry) => {
    const visibility: "customer" | "internal" = entry.visibility === "internal" ? "internal" : "customer";

    return {
      id: entry.id,
      kind: "comment" as const,
      visibility,
      message: readStructuredText(entry.bodyJson),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      author: entry.author,
    };
  });
  const attachments = options.attachments.map((attachment) => {
    const visibility: "customer" | "internal" =
      attachment.visibility === "internal" ? "internal" : "customer";

    return {
      id: `activity_${attachment.id}`,
      kind: "attachment" as const,
      visibility,
      createdAt: attachment.createdAt,
      updatedAt: attachment.createdAt,
      author: attachment.uploadedBy,
      attachment: {
        id: attachment.id,
        visibility,
        filename: attachment.filename,
        contentType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
        createdAt: attachment.createdAt,
        uploadedBy: attachment.uploadedBy,
        downloadPath: buildAttachmentDownloadPath(options.workspaceSlug, attachment.id),
      },
    };
  });
  const fieldChanges = options.fieldChanges.map((entry) => ({
    id: entry.id,
    kind: "field_change" as const,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    author: entry.author,
    changes: entry.changes,
  }));

  return [...customerUpdates, ...internalNotes, ...comments, ...attachments, ...fieldChanges].sort(
    (left, right) => compareIsoTimestampsDescending(left.createdAt, right.createdAt),
  );
}

function buildAttachmentDownloadPath(workspaceSlug: string, attachmentId: string): string {
  return `/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/files/${encodeURIComponent(attachmentId)}/download`;
}

function createContentDisposition(filename: string): string {
  const sanitized = filename.replace(/[\r\n"]/g, "_");
  return `attachment; filename="${sanitized}"`;
}

function normalizeArrayBuffer(value: ArrayBufferLike): ArrayBuffer {
  return Uint8Array.from(new Uint8Array(value)).buffer;
}

async function findWorkspaceAttachmentRecord(
  context: Context<ApiAppContext>,
  workspaceId: string,
  attachmentId: string,
) {
  try {
    return await findWorkspaceAttachmentAccessRecord(context.env.DB, workspaceId, attachmentId);
  } catch (error) {
    if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
      throw error;
    }

    return findLocalDevelopmentWorkspaceAttachmentRecord(workspaceId, attachmentId);
  }
}

async function readAttachmentBody(
  context: Context<ApiAppContext>,
  attachment: {
    readonly id: string;
    readonly r2ObjectKey: string;
  },
): Promise<ArrayBuffer | null> {
  if (attachment.r2ObjectKey.startsWith("local-development/")) {
    const body = readLocalDevelopmentAttachmentBody(attachment.id);

    if (!body) {
      return null;
    }

    return normalizeArrayBuffer(body.buffer);
  }

  const object = await context.env.ATTACHMENTS.get(attachment.r2ObjectKey);

  if (!object) {
    return null;
  }

  return normalizeArrayBuffer(await object.arrayBuffer());
}

async function persistTicketCommunicationMutation(
  context: Context<ApiAppContext>,
  options: {
    readonly entryId: string;
    readonly ticketId: string;
    readonly authorUserId: string;
    readonly visibility: "customer" | "internal";
    readonly messageJson: string;
    readonly timestamp: string;
    readonly workspaceId: string;
    readonly actorType: "internal_user" | "customer_user";
    readonly auditAction: string;
    readonly ticketNumber: string;
  },
): Promise<void> {
  try {
    await createTicketCommunicationEntry(context.env.DB, {
      id: options.entryId,
      ticketId: options.ticketId,
      authorUserId: options.authorUserId,
      visibility: options.visibility,
      messageJson: options.messageJson,
      createdAt: options.timestamp,
    });
    await updateTicketTimestamp(context.env.DB, options.ticketId, options.timestamp);
    await createAuditEvent(context.env.DB, {
      id: createRecordId("aud"),
      actorUserId: options.authorUserId,
      actorType: options.actorType,
      workspaceId: options.workspaceId,
      resourceType: "ticket_update",
      resourceId: options.entryId,
      action: options.auditAction,
      metadataJson: JSON.stringify({
        ticketId: options.ticketId,
        ticketNumber: options.ticketNumber,
        visibility: options.visibility,
      }),
      createdAt: options.timestamp,
    });
  } catch (error) {
    if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
      throw error;
    }

    createLocalDevelopmentTicketCommunicationEntry({
      id: options.entryId,
      ticketId: options.ticketId,
      authorUserId: options.authorUserId,
      visibility: options.visibility,
      messageJson: options.messageJson,
      createdAt: options.timestamp,
    });
    updateLocalDevelopmentTicketTimestamp(options.ticketId, options.timestamp);
    createLocalDevelopmentAuditEvent();
  }
}

async function persistTicketFieldUpdateMutation(
  context: Context<ApiAppContext>,
  options: {
    readonly ticketId: string;
    readonly status: string;
    readonly priority: string;
    readonly assigneeMemberId: string | null;
    readonly dueDate: string | null;
    readonly authorUserId: string;
    readonly timestamp: string;
    readonly workspaceId: string;
    readonly actorType: "internal_user" | "customer_user";
    readonly ticketNumber: string;
    readonly changes: readonly TicketFieldChangeRecord["changes"][number][];
  },
): Promise<void> {
  try {
    await updateTicketFields(context.env.DB, {
      ticketId: options.ticketId,
      status: options.status,
      priority: options.priority,
      assigneeMemberId: options.assigneeMemberId,
      dueDate: options.dueDate,
      updatedAt: options.timestamp,
    });
    await createAuditEvent(context.env.DB, {
      id: createRecordId("aud"),
      actorUserId: options.authorUserId,
      actorType: options.actorType,
      workspaceId: options.workspaceId,
      resourceType: "ticket",
      resourceId: options.ticketId,
      action: "ticket.updated",
      metadataJson: JSON.stringify({
        ticketId: options.ticketId,
        ticketNumber: options.ticketNumber,
        changes: options.changes,
      }),
      createdAt: options.timestamp,
    });
  } catch (error) {
    if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
      throw error;
    }

    updateLocalDevelopmentTicketFields({
      ticketId: options.ticketId,
      status: options.status,
      priority: options.priority,
      assigneeMemberId: options.assigneeMemberId,
      dueDate: options.dueDate,
      authorUserId: options.authorUserId,
      updatedAt: options.timestamp,
      changes: options.changes,
    });
    createLocalDevelopmentAuditEvent();
  }
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
    readonly status?: string | null;
    readonly priority?: string | null;
    readonly assigneeMemberId?: string | null;
    readonly query?: string | null;
    readonly sort?: TicketListSort;
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
      status: options.status,
      priority: options.priority,
      assigneeMemberId: options.assigneeMemberId,
      query: options.query,
      sort: options.sort,
    });
  }
}

function buildTicketListValueOptions(
  values: readonly string[],
  selectedValue: string | null,
  preferredOrder: readonly string[],
): readonly string[] {
  const distinctValues = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue || distinctValues.has(normalizedValue)) {
      continue;
    }

    distinctValues.set(normalizedValue, value);
  }

  if (selectedValue) {
    const normalizedSelectedValue = selectedValue.trim().toLowerCase();

    if (normalizedSelectedValue && !distinctValues.has(normalizedSelectedValue)) {
      distinctValues.set(normalizedSelectedValue, selectedValue);
    }
  }

  return [...distinctValues.values()].sort((left, right) =>
    compareTicketListOptionValues(left, right, preferredOrder),
  );
}

function compareTicketListOptionValues(left: string, right: string, preferredOrder: readonly string[]): number {
  const leftIndex = findTicketListPreferredOrderIndex(left, preferredOrder);
  const rightIndex = findTicketListPreferredOrderIndex(right, preferredOrder);

  if (leftIndex !== rightIndex) {
    return leftIndex - rightIndex;
  }

  return left.localeCompare(right);
}

function findTicketListPreferredOrderIndex(value: string, preferredOrder: readonly string[]): number {
  const normalizedValue = value.trim().toLowerCase();
  const index = preferredOrder.findIndex((candidate) => candidate.toLowerCase() === normalizedValue);

  return index === -1 ? preferredOrder.length : index;
}

function buildTicketListStatusOptions(
  items: readonly {
    readonly status: string;
  }[],
  selectedStatus: string | null,
): readonly string[] {
  return buildTicketListValueOptions(
    items.map((item) => item.status),
    selectedStatus,
    ticketStatusValues,
  );
}

function buildTicketListPriorityOptions(
  items: readonly {
    readonly priority: string;
  }[],
  selectedPriority: string | null,
): readonly string[] {
  return buildTicketListValueOptions(
    items.map((item) => item.priority),
    selectedPriority,
    ticketPriorityValues,
  );
}

function buildTicketListAssigneeOptions(
  items: readonly {
    readonly assignee: {
      readonly memberId: string;
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    } | null;
  }[],
): readonly {
  readonly memberId: string;
  readonly userId: string;
  readonly displayName: string | null;
  readonly email: string;
}[] {
  const assignees = new Map<
    string,
    {
      readonly memberId: string;
      readonly userId: string;
      readonly displayName: string | null;
      readonly email: string;
    }
  >();

  for (const item of items) {
    if (!item.assignee || assignees.has(item.assignee.memberId)) {
      continue;
    }

    assignees.set(item.assignee.memberId, item.assignee);
  }

  return [...assignees.values()].sort((left, right) =>
    (left.displayName ?? left.email).localeCompare(right.displayName ?? right.email),
  );
}

function hasTicketListQuery(options: {
  readonly status: string | null;
  readonly priority: string | null;
  readonly assigneeMemberId: string | null;
  readonly q: string | null;
  readonly sort: TicketListSort;
}): boolean {
  return (
    options.status !== null ||
    options.priority !== null ||
    options.assigneeMemberId !== null ||
    options.q !== null ||
    options.sort !== defaultTicketListSort
  );
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

async function listWorkspaceAssignableMemberRecords(
  context: Context<ApiAppContext>,
  workspaceId: string,
) {
  try {
    return await listWorkspaceAssignableMembers(context.env.DB, workspaceId);
  } catch (error) {
    if (!shouldUseLocalDevelopmentFallback(context.env, error)) {
      throw error;
    }

    return listLocalDevelopmentWorkspaceAssignableMembers(workspaceId);
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

async function readTicketFieldUpdateInput(
  context: Context<ApiAppContext>,
  options: {
    readonly allowedStatusValues: readonly string[];
    readonly allowedPriorityValues: readonly string[];
  },
) {
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

  const result = z
    .object({
      status: z.preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().optional()),
      priority: z.preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().optional()),
      assigneeMemberId: z.preprocess(
        (value) => (typeof value === "string" ? value.trim() || null : value),
        z.union([z.string(), z.null()]).optional(),
      ),
      dueDate: z.preprocess(
        (value) => (typeof value === "string" ? value.trim() || null : value),
        z.union([z.string(), z.null()]).optional(),
      ),
    })
    .superRefine((input, validation) => {
      if (
        input.status === undefined &&
        input.priority === undefined &&
        input.assigneeMemberId === undefined &&
        input.dueDate === undefined
      ) {
        validation.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one editable ticket field is required.",
        });
      }

      if (input.status !== undefined && !options.allowedStatusValues.includes(input.status)) {
        validation.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["status"],
          message: "Select a valid ticket status.",
        });
      }

      if (input.priority !== undefined && !options.allowedPriorityValues.includes(input.priority)) {
        validation.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["priority"],
          message: "Select a valid ticket priority.",
        });
      }

      if (input.dueDate !== undefined && input.dueDate !== null && !ticketFieldDatePattern.test(input.dueDate)) {
        validation.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDate"],
          message: "Provide a valid due date.",
        });
      }
    })
    .safeParse(payload);

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

function resolveTicketFieldChangeLabel(field: TicketFieldChangeRecord["changes"][number]["field"]): string {
  switch (field) {
    case "status":
      return "Status";
    case "priority":
      return "Priority";
    case "assignee":
      return "Assignee";
    case "dueDate":
      return "Due date";
  }
}

function formatAssigneeLabel(assignee: { readonly displayName: string | null; readonly email: string } | null): string {
  return assignee ? assignee.displayName ?? assignee.email : "Unassigned";
}

function createTicketFieldChanges(options: {
  readonly currentTicket: {
    readonly status: string;
    readonly priority: string;
    readonly dueDate: string | null;
    readonly assignee: {
      readonly memberId: string;
      readonly displayName: string | null;
      readonly email: string;
    } | null;
  };
  readonly nextValues: {
    readonly status: string;
    readonly priority: string;
    readonly dueDate: string | null;
    readonly assignee: {
      readonly memberId: string;
      readonly displayName: string | null;
      readonly email: string;
    } | null;
  };
}): readonly TicketFieldChangeRecord["changes"][number][] {
  const changes: TicketFieldChangeRecord["changes"][number][] = [];

  if (options.currentTicket.status !== options.nextValues.status) {
    changes.push({
      field: "status",
      label: resolveTicketFieldChangeLabel("status"),
      from: options.currentTicket.status,
      to: options.nextValues.status,
    });
  }

  if (options.currentTicket.priority !== options.nextValues.priority) {
    changes.push({
      field: "priority",
      label: resolveTicketFieldChangeLabel("priority"),
      from: options.currentTicket.priority,
      to: options.nextValues.priority,
    });
  }

  if ((options.currentTicket.dueDate ?? null) !== (options.nextValues.dueDate ?? null)) {
    changes.push({
      field: "dueDate",
      label: resolveTicketFieldChangeLabel("dueDate"),
      from: options.currentTicket.dueDate,
      to: options.nextValues.dueDate,
    });
  }

  if ((options.currentTicket.assignee?.memberId ?? null) !== (options.nextValues.assignee?.memberId ?? null)) {
    changes.push({
      field: "assignee",
      label: resolveTicketFieldChangeLabel("assignee"),
      from: formatAssigneeLabel(options.currentTicket.assignee),
      to: formatAssigneeLabel(options.nextValues.assignee),
    });
  }

  return changes;
}

function readMissingTicketUpdatePermissionMessage(
  changes: readonly TicketFieldChangeRecord["changes"][number][],
  actorRole: Role,
): string | null {
  if (
    changes.some((change) => change.field === "status") &&
    !hasPermission(actorRole, "tickets.change_status")
  ) {
    return "The current session cannot change ticket status.";
  }

  if (changes.some((change) => change.field === "assignee") && !hasPermission(actorRole, "tickets.assign")) {
    return "The current session cannot change ticket assignee.";
  }

  if (
    changes.some((change) => change.field === "priority" || change.field === "dueDate") &&
    !hasPermission(actorRole, "tickets.update")
  ) {
    return "The current session cannot update this ticket metadata.";
  }

  return null;
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

      const queryResult = ticketListQuerySchema.safeParse(context.req.query());

      if (!queryResult.success) {
        return respondWithError(
          context,
          400,
          "validation_error",
          queryResult.error.issues[0]?.message ?? "A valid ticket list query is required.",
        );
      }

      const includeInternalOnly = hasPermission(workspaceAccess.actorRole, "tickets.view_internal_notes");
      const visibleTicketList = await listWorkspaceTicketRecords(context, overview.workspace.id, {
        includeInternalOnly,
        sort: defaultTicketListSort,
      });
      const ticketList = hasTicketListQuery(queryResult.data)
        ? await listWorkspaceTicketRecords(context, overview.workspace.id, {
            includeInternalOnly,
            status: queryResult.data.status,
            priority: queryResult.data.priority,
            assigneeMemberId: queryResult.data.assigneeMemberId,
            query: queryResult.data.q,
            sort: queryResult.data.sort,
          })
        : visibleTicketList;

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
          filters: {
            applied: {
              status: queryResult.data.status,
              priority: queryResult.data.priority,
              assigneeMemberId: queryResult.data.assigneeMemberId,
              q: queryResult.data.q,
              sort: queryResult.data.sort,
            },
            statusOptions: buildTicketListStatusOptions(visibleTicketList.items, queryResult.data.status),
            priorityOptions: buildTicketListPriorityOptions(visibleTicketList.items, queryResult.data.priority),
            assigneeOptions: buildTicketListAssigneeOptions(visibleTicketList.items),
            totalVisibleCount: visibleTicketList.items.length,
            filteredCount: ticketList.items.length,
          },
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
      const canUpdateTicketFields = hasPermission(workspaceAccess.actorRole, "tickets.update");
      const canAssignTickets = hasPermission(workspaceAccess.actorRole, "tickets.assign");
      const canChangeTicketStatus = hasPermission(workspaceAccess.actorRole, "tickets.change_status");
      const assigneeOptions = canAssignTickets
        ? await listWorkspaceAssignableMemberRecords(context, overview.workspace.id)
        : [];

      const activityTimeline = buildTicketActivityTimeline({
        workspaceSlug: workspaceAccess.workspaceSlug,
        customerVisibleUpdates: ticketDetail.sections.customerVisibleUpdates,
        internalNotes: ticketDetail.sections.internalNotes,
        comments: ticketDetail.sections.commentsActivity,
        attachments: ticketDetail.sections.attachments,
        fieldChanges: ticketDetail.sections.fieldChanges,
      });

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
          editing: {
            statusOptions: [...buildAllowedTicketStatusValues(ticketDetail.ticket.status)],
            priorityOptions: [...buildAllowedTicketPriorityValues(ticketDetail.ticket.priority)],
            assigneeOptions: assigneeOptions.map((assignee) => ({
              memberId: assignee.memberId,
              userId: assignee.userId,
              displayName: assignee.displayName,
              email: assignee.email,
            })),
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
            activityTimeline,
            attachments: ticketDetail.sections.attachments.map((attachment) => ({
              id: attachment.id,
              visibility: attachment.visibility === "internal" ? "internal" : "customer",
              filename: attachment.filename,
              contentType: attachment.contentType,
              sizeBytes: attachment.sizeBytes,
              createdAt: attachment.createdAt,
              uploadedBy: attachment.uploadedBy,
              downloadPath: buildAttachmentDownloadPath(workspaceAccess.workspaceSlug, attachment.id),
            })),
          },
          access: {
            actorRole: workspaceAccess.actorRole,
            accessPath: workspaceAccess.accessPath,
            canViewInternalNotes,
            canViewAttachments,
            canCreateInternalNotes: hasPermission(workspaceAccess.actorRole, "tickets.create_internal_notes"),
            canCreateCustomerUpdates: hasPermission(workspaceAccess.actorRole, "tickets.create_customer_updates"),
            canUpdateTicketFields,
            canAssignTickets,
            canChangeTicketStatus,
          },
        },
      });
    },
  );

  app.get(
    "/api/v1/workspaces/:workspaceSlug/files/:fileId/download",
    resolveWorkspaceAccessContext,
    requireWorkspacePermission("workspace.view"),
    requireWorkspacePermission("attachments.view"),
    async (context) => {
      const workspaceAccess = getWorkspaceAccess(context);

      if (!workspaceAccess || workspaceAccess.status !== "authorized") {
        return respondWithError(
          context,
          500,
          "internal_error",
          "Workspace access context should be authorized before file access rendering.",
        );
      }

      const overview = await findWorkspaceOverview(context, workspaceAccess.workspaceSlug);

      if (!overview) {
        return respondWithError(context, 404, "not_found", "Attachment was not found.");
      }

      const attachmentId = context.req.param("fileId");

      if (!attachmentId) {
        return respondWithError(context, 500, "internal_error", "Attachment routes require a file identifier.");
      }

      const attachment = await findWorkspaceAttachmentRecord(context, overview.workspace.id, attachmentId);

      if (!attachment) {
        return respondWithError(context, 404, "not_found", "Attachment was not found.");
      }

      if (attachment.linkedResourceType !== "ticket") {
        return respondWithError(context, 404, "not_found", "Attachment was not found.");
      }

      const canViewInternalNotes = hasPermission(workspaceAccess.actorRole, "tickets.view_internal_notes");

      if (
        (attachment.visibility === "internal" || attachment.ticketVisibility === "internal_only") &&
        !canViewInternalNotes
      ) {
        return respondWithError(context, 404, "not_found", "Attachment was not found.");
      }

      const body = await readAttachmentBody(context, attachment);

      if (!body) {
        return respondWithError(context, 404, "not_found", "Attachment content was not found.");
      }

      return new Response(body, {
        status: 200,
        headers: {
          "content-type": attachment.contentType,
          "content-disposition": createContentDisposition(attachment.filename),
          "cache-control": "private, no-store",
        },
      });
    },
  );

  app.patch(
    "/api/v1/workspaces/:workspaceSlug/tickets/:ticketId",
    resolveWorkspaceAccessContext,
    requireWorkspacePermission("workspace.view"),
    requireWorkspacePermission("tickets.view"),
    async (context) => {
      const ticketContext = await resolveAuthorizedTicketContext(context);

      if ("response" in ticketContext) {
        return ticketContext.response;
      }

      const allowedStatusValues = buildAllowedTicketStatusValues(ticketContext.ticketDetail.ticket.status);
      const allowedPriorityValues = buildAllowedTicketPriorityValues(ticketContext.ticketDetail.ticket.priority);
      const input = await readTicketFieldUpdateInput(context, {
        allowedStatusValues,
        allowedPriorityValues,
      });

      if ("error" in input) {
        return input.error;
      }

      const assigneeOptions = await listWorkspaceAssignableMemberRecords(context, ticketContext.overview.workspace.id);
      const nextAssigneeMemberId =
        input.data.assigneeMemberId !== undefined
          ? input.data.assigneeMemberId
          : ticketContext.ticketDetail.ticket.assignee?.memberId ?? null;
      const nextAssignee =
        nextAssigneeMemberId === null
          ? null
          : assigneeOptions.find((candidate) => candidate.memberId === nextAssigneeMemberId) ?? null;

      if (nextAssigneeMemberId !== null && !nextAssignee) {
        return respondWithError(context, 400, "validation_error", "Select a valid active assignee.");
      }

      const nextValues = {
        status: input.data.status ?? ticketContext.ticketDetail.ticket.status,
        priority: input.data.priority ?? ticketContext.ticketDetail.ticket.priority,
        dueDate:
          input.data.dueDate !== undefined ? input.data.dueDate : ticketContext.ticketDetail.ticket.dueDate,
        assignee: nextAssignee,
      };
      const changes = createTicketFieldChanges({
        currentTicket: ticketContext.ticketDetail.ticket,
        nextValues,
      });
      const permissionMessage = readMissingTicketUpdatePermissionMessage(
        changes,
        ticketContext.workspaceAccess.actorRole,
      );

      if (permissionMessage) {
        return respondWithError(context, 403, "forbidden", permissionMessage);
      }

      if (changes.length === 0) {
        return context.json({
          data: {
            ticket: {
              id: ticketContext.ticketDetail.ticket.id,
              status: ticketContext.ticketDetail.ticket.status,
              priority: ticketContext.ticketDetail.ticket.priority,
              dueDate: ticketContext.ticketDetail.ticket.dueDate,
              assignee: ticketContext.ticketDetail.ticket.assignee,
            },
            changes: [],
          },
        });
      }

      const timestamp = new Date().toISOString();
      const requestSession = getRequestSession(context);

      if (!isAuthenticatedSession(requestSession)) {
        return respondWithError(context, 500, "internal_error", "Authenticated mutations require a resolved user session.");
      }

      await persistTicketFieldUpdateMutation(context, {
        ticketId: ticketContext.ticketDetail.ticket.id,
        status: nextValues.status,
        priority: nextValues.priority,
        assigneeMemberId: nextAssignee?.memberId ?? null,
        dueDate: nextValues.dueDate,
        authorUserId: requestSession.user.id,
        timestamp,
        workspaceId: ticketContext.overview.workspace.id,
        actorType: requestSession.user.userType === "internal" ? "internal_user" : "customer_user",
        ticketNumber: ticketContext.ticketDetail.ticket.ticketNumber,
        changes,
      });

      return context.json({
        data: {
          ticket: {
            id: ticketContext.ticketDetail.ticket.id,
            status: nextValues.status,
            priority: nextValues.priority,
            dueDate: nextValues.dueDate,
            assignee:
              nextAssignee === null
                ? null
                : {
                    memberId: nextAssignee.memberId,
                    userId: nextAssignee.userId,
                    displayName: nextAssignee.displayName,
                    email: nextAssignee.email,
                  },
            updatedAt: timestamp,
          },
          changes,
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

      await persistTicketCommunicationMutation(context, {
        entryId,
        ticketId: ticketContext.ticketDetail.ticket.id,
        authorUserId: requestSession.user.id,
        visibility: "internal",
        messageJson: createStructuredTextMessage(input.data.message),
        timestamp,
        workspaceId: ticketContext.overview.workspace.id,
        actorType: requestSession.user.userType === "internal" ? "internal_user" : "customer_user",
        auditAction: "ticket.internal_note.created",
        ticketNumber: ticketContext.ticketDetail.ticket.ticketNumber,
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

      await persistTicketCommunicationMutation(context, {
        entryId,
        ticketId: ticketContext.ticketDetail.ticket.id,
        authorUserId: requestSession.user.id,
        visibility: "customer",
        messageJson: createStructuredTextMessage(input.data.message),
        timestamp,
        workspaceId: ticketContext.overview.workspace.id,
        actorType: requestSession.user.userType === "internal" ? "internal_user" : "customer_user",
        auditAction: "ticket.customer_update.created",
        ticketNumber: ticketContext.ticketDetail.ticket.ticketNumber,
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
