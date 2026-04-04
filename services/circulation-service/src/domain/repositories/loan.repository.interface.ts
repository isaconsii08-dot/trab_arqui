import { Loan } from '../entities/loan.entity';

export interface ILoanRepository {
  findById(id: string): Promise<Loan | null>;
  findActiveLoanByItemBarcode(barcode: string): Promise<Loan | null>;
  findActiveLoansByPatron(patronId: string): Promise<Loan[]>;
  findLoansByPatron(patronId: string, page: number, limit: number): Promise<{ data: Loan[]; total: number }>;
  findOverdueLoans(): Promise<Loan[]>;
  save(loan: Loan): Promise<Loan>;
  countActiveByPatron(patronId: string): Promise<number>;
}

export const LOAN_REPOSITORY = Symbol('ILoanRepository');
