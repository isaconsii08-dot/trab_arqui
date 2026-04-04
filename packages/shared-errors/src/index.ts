// ─────────────────────────────────────────────────────────────────────────────
// BiblioFlow – Domain Error Hierarchy
// ─────────────────────────────────────────────────────────────────────────────

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
    };
  }
}

// ── Not Found ─────────────────────────────────────────────────────────────────
export class PatronNotFoundError extends DomainError {
  readonly code = 'PATRON_NOT_FOUND';
  readonly statusCode = 404;
  constructor(identifier: string) {
    super(`Patron not found: ${identifier}`);
  }
}

export class ItemNotFoundError extends DomainError {
  readonly code = 'ITEM_NOT_FOUND';
  readonly statusCode = 404;
  constructor(barcode: string) {
    super(`Item not found with barcode: ${barcode}`);
  }
}

export class RecordNotFoundError extends DomainError {
  readonly code = 'RECORD_NOT_FOUND';
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Bibliographic record not found: ${id}`);
  }
}

export class LoanNotFoundError extends DomainError {
  readonly code = 'LOAN_NOT_FOUND';
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Loan not found: ${id}`);
  }
}

// ── Business Rule Violations ──────────────────────────────────────────────────
export class PatronSuspendedError extends DomainError {
  readonly code = 'PATRON_SUSPENDED';
  readonly statusCode = 422;
  constructor(patronId: string) {
    super(`Patron ${patronId} is suspended and cannot borrow materials`);
  }
}

export class PatronHasPendingFinesError extends DomainError {
  readonly code = 'PATRON_HAS_PENDING_FINES';
  readonly statusCode = 422;
  constructor(patronId: string, amount: number) {
    super(`Patron ${patronId} has pending fines of €${amount.toFixed(2)}`);
  }
}

export class ItemNotAvailableError extends DomainError {
  readonly code = 'ITEM_NOT_AVAILABLE';
  readonly statusCode = 422;
  constructor(barcode: string, status: string) {
    super(`Item ${barcode} is not available (current status: ${status})`);
  }
}

export class LoanLimitExceededError extends DomainError {
  readonly code = 'LOAN_LIMIT_EXCEEDED';
  readonly statusCode = 422;
  constructor(patronId: string, limit: number) {
    super(`Patron ${patronId} has reached the maximum loan limit of ${limit} items`);
  }
}

export class MaxRenewalsReachedError extends DomainError {
  readonly code = 'MAX_RENEWALS_REACHED';
  readonly statusCode = 422;
  constructor(loanId: string, max: number) {
    super(`Loan ${loanId} has reached the maximum number of renewals (${max})`);
  }
}

export class ItemAlreadyReturnedError extends DomainError {
  readonly code = 'ITEM_ALREADY_RETURNED';
  readonly statusCode = 422;
  constructor(loanId: string) {
    super(`Loan ${loanId} has already been returned`);
  }
}

// ── Auth Errors ───────────────────────────────────────────────────────────────
export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';
  readonly statusCode = 401;
  constructor() {
    super('Invalid email or password');
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;
  constructor() {
    super('Authentication required');
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;
  constructor(action: string) {
    super(`You do not have permission to: ${action}`);
  }
}

// ── Conflict Errors ───────────────────────────────────────────────────────────
export class EmailAlreadyRegisteredError extends DomainError {
  readonly code = 'EMAIL_ALREADY_REGISTERED';
  readonly statusCode = 409;
  constructor(email: string) {
    super(`Email ${email} is already registered`);
  }
}

export class CardNumberAlreadyExistsError extends DomainError {
  readonly code = 'CARD_NUMBER_EXISTS';
  readonly statusCode = 409;
  constructor(cardNumber: string) {
    super(`Card number ${cardNumber} is already in use`);
  }
}
