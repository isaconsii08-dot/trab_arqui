// ─────────────────────────────────────────────────────────────────────────────
// Circulation Service – Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export type LoanStatus = 'pending' | 'active' | 'returned' | 'overdue' | 'lost';
export type ReservationStatus = 'waiting' | 'available' | 'fulfilled' | 'cancelled' | 'expired';

export interface LoanDto {
  id: string;
  itemId: string;
  patronId: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: LoanStatus;
  renewedCount: number;
  fineAmount: number;
  itemBarcode: string;
  itemTitle: string;
}

export interface ReservationDto {
  id: string;
  itemId: string;
  patronId: string;
  reserveDate: string;
  expiryDate: string;
  status: ReservationStatus;
  itemTitle: string;
  position: number;
}

export interface CreateLoanCommand {
  itemBarcode: string;
  patronCardNumber: string;
  staffId: string;
  libraryId: string;
}

export interface ReturnItemCommand {
  itemBarcode: string;
  staffId: string;
}

export interface RenewLoanCommand {
  loanId: string;
  patronId: string;
}
