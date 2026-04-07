// Port: what the Circulation Service needs from the Patron Service
export interface PatronSnapshot {
  id: string;
  cardNumber: string;
  fullName: string;
  status: string;
  pendingFinesAmount: number;
  assertCanBorrow(): void;
}

export interface IPatronServiceClient {
  getPatronByCardNumber(cardNumber: string): Promise<PatronSnapshot | null>;
  getPatronById(id: string): Promise<PatronSnapshot | null>;
  createFine(patronId: string, loanId: string, amount: number, reason: string): Promise<void>;
}

export const PATRON_SERVICE_CLIENT = Symbol('IPatronServiceClient');
