import type { TicketListData, TicketListItem } from "../navigation/types.ts";

export function readTicketListResponse(value: unknown): TicketListData {
  const record = expectRecord(value);
  const data = expectRecord(record.data);
  const workspace = expectRecord(data.workspace);

  return {
    workspace: {
      id: expectString(workspace.id),
      slug: expectString(workspace.slug),
      name: expectString(workspace.name),
    },
    items: expectArray(data.items).map(readTicketListItem),
  };
}

function readTicketListItem(value: unknown): TicketListItem {
  const record = expectRecord(value);

  return {
    id: expectString(record.id),
    ticketNumber: expectString(record.ticketNumber),
    title: expectString(record.title),
    status: expectString(record.status),
    priority: expectString(record.priority),
    updatedAt: expectString(record.updatedAt),
    assignee: record.assignee === null ? null : readTicketAssignee(record.assignee),
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

function expectArray(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error("Expected array.");
  }

  return value;
}

function expectString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Expected string value.");
  }

  return value;
}

function readNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return expectString(value);
}
