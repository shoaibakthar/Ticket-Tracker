import { isKnownRole } from "../../../../packages/auth/src/roles.ts";
import type {
  TicketActivityEntry,
  TicketActorSummary,
  TicketActorSummaryWithMemberId,
  TicketAttachmentSummary,
  TicketCommunicationEntry,
  TicketDetailData,
  TicketFieldChangeActivityEntry,
  TicketListItem,
  WorkspaceOverviewData,
} from "../navigation/types.ts";

export function readTicketDetailResponse(value: unknown): TicketDetailData {
  const record = expectRecord(value);
  const data = expectRecord(record.data);
  const workspace = expectRecord(data.workspace);
  const ticket = expectRecord(data.ticket);
  const access = expectRecord(data.access);
  const sections = expectRecord(data.sections);
  const actorRole = expectString(access.actorRole);

  if (!isKnownRole(actorRole)) {
    throw new Error("Invalid ticket detail actor role.");
  }

  const status = expectString(ticket.status);
  const priority = expectString(ticket.priority);

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
      status,
      priority,
      dueDate: readNullableString(ticket.dueDate),
      updatedAt: expectString(ticket.updatedAt),
      assignee: ticket.assignee === null ? null : readTicketAssignee(ticket.assignee),
    },
    summary: {
      currentStanding: expectString(expectRecord(data.summary).currentStanding),
    },
    editing: readEditingOptions(data.editing, { status, priority }),
    sections: {
      customerVisibleUpdates: readCommunicationEntries(sections.customerVisibleUpdates),
      internalNotes: readNullableCommunicationEntries(sections.internalNotes),
      activityTimeline: readActivityEntries(readSectionValue(sections, "activityTimeline", "commentsActivity")),
      attachments: readAttachmentEntries(sections.attachments),
    },
    access: {
      actorRole,
      accessPath: expectAccessPath(access.accessPath),
      canViewInternalNotes: expectBoolean(access.canViewInternalNotes),
      canViewAttachments: expectBoolean(access.canViewAttachments),
      canCreateInternalNotes: expectBoolean(access.canCreateInternalNotes),
      canCreateCustomerUpdates: expectBoolean(access.canCreateCustomerUpdates),
      canUpdateTicketFields: readBooleanWithDefault(access.canUpdateTicketFields, false),
      canAssignTickets: readBooleanWithDefault(access.canAssignTickets, false),
      canChangeTicketStatus: readBooleanWithDefault(access.canChangeTicketStatus, false),
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

function readBooleanWithDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
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

  if (kind === "customer_update") {
    if (expectVisibility(record.visibility) !== "customer") {
      throw new Error("Invalid customer update visibility.");
    }

    return {
      id: expectString(record.id),
      kind,
      visibility: "customer",
      message: expectString(record.message),
      createdAt: expectString(record.createdAt),
      updatedAt: expectString(record.updatedAt),
      author: readAuthor(record.author),
    };
  }

  if (kind === "internal_note") {
    if (expectVisibility(record.visibility) !== "internal") {
      throw new Error("Invalid internal note visibility.");
    }

    return {
      id: expectString(record.id),
      kind,
      visibility: "internal",
      message: expectString(record.message),
      createdAt: expectString(record.createdAt),
      updatedAt: expectString(record.updatedAt),
      author: readAuthor(record.author),
    };
  }

  if (kind === "comment") {
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

  if (kind === "attachment") {
    return {
      id: expectString(record.id),
      kind,
      visibility: expectVisibility(record.visibility),
      createdAt: expectString(record.createdAt),
      updatedAt: expectString(record.updatedAt),
      author: readAuthor(record.author),
      attachment: readAttachmentEntry(record.attachment),
    };
  }

  if (kind === "field_change") {
    return {
      id: expectString(record.id),
      kind,
      createdAt: expectString(record.createdAt),
      updatedAt: expectString(record.updatedAt),
      author: readAuthor(record.author),
      changes: readFieldChanges(record.changes),
    };
  }

  throw new Error("Invalid activity entry kind.");
}

function readAttachmentEntries(value: unknown): readonly TicketAttachmentSummary[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected attachment entry array.");
  }

  return value.map(readAttachmentEntry);
}

function readSectionValue(
  sections: Record<string, unknown>,
  primaryKey: string,
  fallbackKey: string,
): unknown {
  if (primaryKey in sections) {
    return sections[primaryKey];
  }

  return sections[fallbackKey];
}

function readAttachmentEntry(value: unknown): TicketAttachmentSummary {
  const record = expectRecord(value);

  return {
    id: expectString(record.id),
    visibility: expectVisibility(record.visibility),
    filename: expectString(record.filename),
    downloadPath: expectString(record.downloadPath),
    contentType: expectString(record.contentType),
    sizeBytes: expectNumber(record.sizeBytes),
    createdAt: expectString(record.createdAt),
    uploadedBy: readAuthor(record.uploadedBy),
  };
}

function readAuthor(value: unknown): TicketActorSummary {
  const record = expectRecord(value);

  return {
    userId: expectString(record.userId),
    displayName: readNullableString(record.displayName),
    email: expectString(record.email),
  };
}

function readAuthorWithMemberId(value: unknown): TicketActorSummaryWithMemberId {
  const record = expectRecord(value);

  return {
    memberId: expectString(record.memberId),
    userId: expectString(record.userId),
    displayName: readNullableString(record.displayName),
    email: expectString(record.email),
  };
}

function readEditingOptions(
  value: unknown,
  fallback: {
    readonly status: string;
    readonly priority: string;
  },
): TicketDetailData["editing"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      statusOptions: [fallback.status],
      priorityOptions: [fallback.priority],
      assigneeOptions: [],
    };
  }

  const record = value as Record<string, unknown>;

  return {
    statusOptions: readStringArray(record.statusOptions, [fallback.status]),
    priorityOptions: readStringArray(record.priorityOptions, [fallback.priority]),
    assigneeOptions: readAssignableMembers(record.assigneeOptions),
  };
}

function readStringArray(value: unknown, fallback: readonly string[]): readonly string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map(expectString);
}

function readAssignableMembers(value: unknown): readonly TicketActorSummaryWithMemberId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(readAuthorWithMemberId);
}

function readFieldChanges(
  value: unknown,
): TicketFieldChangeActivityEntry["changes"] {
  if (!Array.isArray(value)) {
    throw new Error("Expected field change array.");
  }

  return value.map((item) => {
    const record = expectRecord(item);
    const field = expectString(record.field);

    if (field !== "status" && field !== "priority" && field !== "assignee" && field !== "dueDate") {
      throw new Error("Invalid ticket field change.");
    }

    return {
      field,
      label: expectString(record.label),
      from: readNullableString(record.from),
      to: readNullableString(record.to),
    };
  });
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
