// ─────────────────────────────────────────────────────────────────────────────
// BiblioFlow – Domain Event Definitions
// All async inter-service communication uses these typed events via Redis Pub/Sub
// ─────────────────────────────────────────────────────────────────────────────

// ── Event channel names (Redis topics) ───────────────────────────────────────
export const EVENTS = {
  // Circulation
  LOAN_CREATED: 'circulation.loan.created',
  LOAN_RETURNED: 'circulation.loan.returned',
  LOAN_OVERDUE: 'circulation.loan.overdue',
  LOAN_RENEWED: 'circulation.loan.renewed',

  // Reservations
  HOLD_PLACED: 'circulation.hold.placed',
  HOLD_AVAILABLE: 'circulation.hold.available',
  HOLD_EXPIRED: 'circulation.hold.expired',

  // Patrons
  PATRON_REGISTERED: 'patron.registered',
  PATRON_BLOCKED: 'patron.blocked',
  FINE_ISSUED: 'patron.fine.issued',
  FINE_PAID: 'patron.fine.paid',

  // Catalog
  RECORD_CREATED: 'catalog.record.created',
  RECORD_UPDATED: 'catalog.record.updated',

  // Holdings
  ITEM_STATUS_CHANGED: 'holdings.item.status_changed',

  // Acquisitions
  ORDER_PLACED: 'acquisitions.order.placed',
  ORDER_RECEIVED: 'acquisitions.order.received',
} as const;

export type EventChannel = (typeof EVENTS)[keyof typeof EVENTS];

// ── Base event envelope ───────────────────────────────────────────────────────
export interface DomainEvent<T = unknown> {
  eventId: string;
  channel: EventChannel;
  occurredAt: string;
  libraryId: string;
  payload: T;
}

// ── Circulation Event Payloads ────────────────────────────────────────────────
export interface LoanCreatedPayload {
  loanId: string;
  itemId: string;
  itemBarcode: string;
  patronId: string;
  loanDate: string;
  dueDate: string;
}

export interface LoanReturnedPayload {
  loanId: string;
  itemId: string;
  patronId: string;
  returnDate: string;
  fineAmount: number;
}

export interface LoanOverduePayload {
  loanId: string;
  patronId: string;
  patronEmail: string;
  itemTitle: string;
  dueDate: string;
  daysOverdue: number;
}

export interface HoldAvailablePayload {
  reservationId: string;
  patronId: string;
  patronEmail: string;
  itemId: string;
  itemTitle: string;
  expiryDate: string;
}

// ── Patron Event Payloads ─────────────────────────────────────────────────────
export interface PatronRegisteredPayload {
  patronId: string;
  libraryId: string;
  email: string;
  fullName: string;
  cardNumber: string;
}

export interface FineIssuedPayload {
  fineId: string;
  patronId: string;
  patronEmail: string;
  loanId: string;
  amount: number;
  reason: string;
}
