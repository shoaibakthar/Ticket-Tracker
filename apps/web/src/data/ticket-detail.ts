import { isKnownRole } from "../../../../packages/auth/src/roles.ts";
import type {
  TicketActivityEntry,
  TicketAttachmentSummary,
  TicketCommunicationEntry,
  TicketDetailData,
  TicketListItem,
  WorkspaceOverviewData,
} from "../navigation/types.ts";

export function readTicketDetailResponse(value: unknown): TicketDetailData {
  const record = expectRecord(value);
  const data = expectRecord(record.data);
  const workspace = expectRecord(data.workspace);
  const ticket = expectRecord(data.ticket);
  const access = expectRecord(data.access);
  const actorRole = expectString(access.actorRole);

  if (!isKnownRole(actorRole)) {
    throw new Error("Invalid ticket detail actor role.");
  }

  return {
    workspace: {
      id: expectString(workspace.id),
      slug: expectString(workspace.slug),
      name: expectString(workspace.name),
    },
    ticket: {
      id: expectString(ticket.id),
      ticketNumber: expectString(ticket.ticketNumber),
      title: expectString(ticket.title),
      description: readNullableString(ticket.description),
      status: expectString(ticket.status),
      priority: expectString(ticket.priority),
      dueDate: readNullableString(ticket.dueDate),
      updatedAt: expectString(ticket.updatedAt),
      assignee: ticket.assignee === null ? null : readTicketAssignee(ticket.assignee),
    },
    summary: {
      currentStanding: expectString(expectRecord(data.summary).currentStanding),
    },
    sections: {
      customerVisibleUpdates: readCommunicationEntries(expectRecord(data.sections).customerVisibleUpdates),
      internalNotes: readNullableCommunicationEntries(expectRecord(data.sections).internalNotes),
      commentsActivity: readActivityEntries(expectRecord(data.sections).commentsActivity),
      attachments: readAttachmentEntries(expectRecord(data.sections).attachments),
    },
    access: {
      actorRole,
      accessPath: expectAccessPath(access.accessPath),
      canViewInternalNotes: expectBoolean(access.canViewInternalNotes),
      canViewAttachments: expectBoolean(access.canViewAttachments),
      canCreateInternalNotes: expectBoolean(access.canCreateInternalNotes),
      canCreateCustomerUpdates: expectBoolean(access.canCreateCustomerUpdates),
    },
  };
}

function readTicketAssignee(value: unknown): TicketListItem["assignee"] {
  const record = expectRecord(value);

  return {
    memberId: expectString(record.memberId),
    userId: expectString(record.userId),
    displayName: readNullableString(record.displayName),
    email: expectString(record.email),
  };
}

function expectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected record object.");
  }

  return value as Record<string, unknown>;
}

function expectString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Expected string.");
  }

  return value;
}

function expectBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new Error("Expected boolean.");
  }

  return value;
}

function readNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return expectString(value);
}

function readCommunicationEntries(value: unknown): readonly TicketCommunicationEntry[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected communication entry array.");
  }

  return value.map(readCommunicationEntry);
}

function readNullableCommunicationEntries(value: unknown): readonly TicketCommunicationEntry[] | null {
  if (value === null) {
    return null;
  }

  return readCommunicationEntries(value);
}

function readCommunicationEntry(value: unknown): TicketCommunicationEntry {
  const record = expectRecord(value);

  return {
    id: expectString(record.id),
    message: expectString(record.message),
    createdAt: expectString(record.createdAt),
    updatedAt: expectString(record.updatedAt),
    author: readAuthor(record.author),
  };
}

function readActivityEntries(value: unknown): readonly TicketActivityEntry[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected activity entry array.");
  }

  return value.map(readActivityEntry);
}

function readActivityEntry(value: unknown): TicketActivityEntry {
  const record = expectRecord(value);
  const kind = expectString(record.kind);

  if (kind !== "comment") {
    throw new Error("Invalid activity entry kind.");
  }

  return {
    id: expectString(record.id),
    kind,
    visibility: expectVisibility(record.visibility),
    message: expectString(record.message),
    createdAt: expectString(record.createdAt),
    updatedAt: expectString(record.updatedAt),
    author: readAuthor(record.author),
  };
}

function readAttachmentEntries(value: unknown): readonly TicketAttachmentSummary[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected attachment entry array.");
  }

  return value.map(readAttachmentEntry);
}

function readAttachmentEntry(value: unknown): TicketAttachmentSummary {
  const record = expectRecord(value);

  return {
    id: expectString(record.id),
    visibility: expectVisibility(record.visibility),
    filename: expectString(record.filename),
    contentType: expectString(record.contentType),
    sizeBytes: expectNumber(record.sizeBytes),
    createdAt: expectString(record.createdAt),
  };
}

function readAuthor(value: unknown): TicketCommunicationEntry["author"] {
  const record = expectRecord(value);

  return {
    userId: expectString(record.userId),
    displayName: readNullableString(record.displayName),
    email: expectString(record.email),
  };
}

function expectAccessPath(value: unknown): WorkspaceOverviewData["access"]["accessPath"] {
  const accessPath = expectString(value);

  if (accessPath !== "workspace-membership" && accessPath !== "cross-workspace-support") {
    throw new Error("Invalid access path.");
  }

  return accessPath;
}

function expectVisibility(value: unknown): "customer" | "internal" {
  const visibility = expectString(value);

  if (visibility !== "customer" && visibility !== "internal") {
    throw new Error("Invalid visibility.");
  }

  return visibility;
}

function expectNumber(value: unknown): number {
  if (typeof value !== "number") {
    throw new Error("Expected number.");
  }

  return value;
}
