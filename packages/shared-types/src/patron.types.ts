// ─────────────────────────────────────────────────────────────────────────────
// Patron Service – Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export type PatronStatus = 'active' | 'suspended' | 'expired' | 'blocked';
export type StaffRole = 'administrator' | 'librarian' | 'assistant';
export type FineStatus = 'pending' | 'paid' | 'waived';

export interface PatronDto {
  id: string;
  libraryId: string;
  cardNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  registrationDate: string;
  status: PatronStatus;
  pendingFinesTotal: number;
}

export interface StaffDto {
  id: string;
  libraryId: string;
  userId: string;
  fullName: string;
  email: string;
  role: StaffRole;
  permissions: string[];
}

export interface FineDto {
  id: string;
  patronId: string;
  loanId: string;
  amount: number;
  reason: string;
  status: FineStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: StaffRole | 'patron';
  libraryId: string;
  iat?: number;
  exp?: number;
}
