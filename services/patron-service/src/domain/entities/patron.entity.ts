import { PatronStatus } from '@biblioflow/shared-types';
import { PatronSuspendedError, PatronHasPendingFinesError } from '@biblioflow/shared-errors';
import { Email } from '../value-objects/email.vo';
import { CardNumber } from '../value-objects/card-number.vo';

// ─────────────────────────────────────────────────────────────────────────────
// Patron – Aggregate Root
// Encapsulates business rules for library members
// ─────────────────────────────────────────────────────────────────────────────

export interface PatronProps {
  id: string;
  libraryId: string;
  cardNumber: CardNumber;
  fullName: string;
  email: Email;
  phone: string | null;
  address: string | null;
  passwordHash: string;
  registrationDate: Date;
  status: PatronStatus;
  pendingFinesAmount: number;
}

export class Patron {
  private constructor(private readonly props: PatronProps) {}

  static create(props: PatronProps): Patron {
    return new Patron(props);
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string {
    return this.props.id;
  }

  get libraryId(): string {
    return this.props.libraryId;
  }

  get cardNumber(): CardNumber {
    return this.props.cardNumber;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get email(): Email {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get address(): string | null {
    return this.props.address;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get registrationDate(): Date {
    return this.props.registrationDate;
  }

  get status(): PatronStatus {
    return this.props.status;
  }

  get pendingFinesAmount(): number {
    return this.props.pendingFinesAmount;
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  // ── Domain Business Rules ──────────────────────────────────────────────────

  assertCanBorrow(): void {
    if (this.props.status === 'suspended' || this.props.status === 'blocked') {
      throw new PatronSuspendedError(this.props.id);
    }
    if (this.props.pendingFinesAmount > 0) {
      throw new PatronHasPendingFinesError(this.props.id, this.props.pendingFinesAmount);
    }
  }

  suspend(): Patron {
    return new Patron({ ...this.props, status: 'suspended' });
  }

  activate(): Patron {
    return new Patron({ ...this.props, status: 'active' });
  }

  block(): Patron {
    return new Patron({ ...this.props, status: 'blocked' });
  }

  expire(): Patron {
    return new Patron({ ...this.props, status: 'expired' });
  }

  updateContactInfo(phone: string | null, address: string | null): Patron {
    return new Patron({ ...this.props, phone, address });
  }
}
