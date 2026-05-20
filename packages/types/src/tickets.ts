export const ticketStatusValues = [
  "New",
  "Open",
  "InProgress",
  "WaitingOnObserveID",
  "WaitingOnCustomer",
  "Blocked",
  "Resolved",
  "Closed",
] as const;

export const ticketPriorityValues = ["Low", "Medium", "High", "Urgent"] as const;

export type TicketStatus = (typeof ticketStatusValues)[number];
export type TicketPriority = (typeof ticketPriorityValues)[number];
