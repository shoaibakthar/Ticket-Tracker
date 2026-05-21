export const ticketStatusValues = [
  "New",
  "Open",
  "Investigating",
  "Identified",
  "InProgress",
  "WaitingOnObserveID",
  "WaitingOnCustomer",
  "WaitingOnVendor",
  "Blocked",
  "Monitoring",
  "Resolved",
  "Closed",
] as const;

export const ticketPriorityValues = ["Low", "Medium", "High", "Urgent"] as const;

export const ticketListSortValues = ["updated_desc", "updated_asc", "priority_desc"] as const;

export type TicketStatus = (typeof ticketStatusValues)[number];
export type TicketPriority = (typeof ticketPriorityValues)[number];
export type TicketListSort = (typeof ticketListSortValues)[number];
