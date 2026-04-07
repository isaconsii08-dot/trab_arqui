import { LoanStatus } from '@biblioflow/shared-types';
import {
  MaxRenewalsReachedError,
  ItemAlreadyReturnedError,
} from '@biblioflow/shared-errors';

// ─────────────────────────────────────────────────────────────────────────────
// Loan – Aggregate Root
// Core business entity for the Circulation bounded context
// ─────────────────────────────────────────────────────────────────────────────

export interface LoanProps {
  id: string;
  itemId: string;
  patronId: string;
  libraryId: string;
  staffId: string;
  loanDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: LoanStatus;
  renewedCount: number;
  fineAmount: number;
}

const MAX_RENEWALS = 3;
const LOAN_DAYS = 21;

export class Loan {
  private constructor(private props: LoanProps) {}

  static create(props: Omit<LoanProps, 'returnDate' | 'status' | 'renewedCount' | 'fineAmount'>): Loan {
    const dueDate = new Date(props.loanDate);
    dueDate.setDate(dueDate.getDate() + LOAN_DAYS);

    return new Loan({
      ...props,
      dueDate,
      returnDate: null,
      status: 'active',
      renewedCount: 0,
      fineAmount: 0,
    });
  }

  static reconstitute(props: LoanProps): Loan {
    return new Loan(props);
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string { return this.props.id; }
  get itemId(): string { return this.props.itemId; }
  get patronId(): string { return this.props.patronId; }
  get libraryId(): string { return this.props.libraryId; }
  get staffId(): string { return this.props.staffId; }
  get loanDate(): Date { return this.props.loanDate; }
  get dueDate(): Date { return this.props.dueDate; }
  get returnDate(): Date | null { return this.props.returnDate; }
  get status(): LoanStatus { return this.props.status; }
  get renewedCount(): number { return this.props.renewedCount; }
  get fineAmount(): number { return this.props.fineAmount; }

  get isActive(): boolean {
    return this.props.status === 'active' || this.props.status === 'overdue';
  }

  get isOverdue(): boolean {
    return this.isActive && new Date() > this.props.dueDate;
  }

  // ── Business Operations ────────────────────────────────────────────────────

  returnItem(): { loan: Loan; fineAmount: number } {
    if (this.props.status === 'returned') {
      throw new ItemAlreadyReturnedError(this.props.id);
    }

    const now = new Date();
    let fineAmount = 0;

    if (now > this.props.dueDate) {
      const daysLate = Math.ceil(
        (now.getTime() - this.props.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      fineAmount = daysLate * 1000; // $1.000 COP por día de retraso
    }

    const updatedLoan = new Loan({
      ...this.props,
      returnDate: now,
      status: 'returned',
      fineAmount,
    });

    return { loan: updatedLoan, fineAmount };
  }

  renew(): Loan {
    if (this.props.renewedCount >= MAX_RENEWALS) {
      throw new MaxRenewalsReachedError(this.props.id, MAX_RENEWALS);
    }
    if (this.props.status === 'returned') {
      throw new ItemAlreadyReturnedError(this.props.id);
    }

    const newDueDate = new Date(this.props.dueDate);
    newDueDate.setDate(newDueDate.getDate() + LOAN_DAYS);

    return new Loan({
      ...this.props,
      dueDate: newDueDate,
      renewedCount: this.props.renewedCount + 1,
      status: 'active',
    });
  }

  markOverdue(): Loan {
    return new Loan({ ...this.props, status: 'overdue' });
  }
}
