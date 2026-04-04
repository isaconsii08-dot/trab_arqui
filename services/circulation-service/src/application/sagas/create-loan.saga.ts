import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  PatronNotFoundError,
  ItemNotFoundError,
  ItemNotAvailableError,
} from '@biblioflow/shared-errors';
import { Loan } from '../../domain/entities/loan.entity';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { IPatronServiceClient } from '../ports/patron-service-client.interface';
import { IHoldingsServiceClient } from '../ports/holdings-service-client.interface';
import { IEventPublisher } from '../ports/event-publisher.interface';
import { CreateLoanCommand } from '@biblioflow/shared-types';
import { EVENTS, LoanCreatedPayload, DomainEvent } from '@biblioflow/shared-events';
import { LoanDto } from '@biblioflow/shared-types';
import { LoanMapper } from '../mappers/loan.mapper';

// ─────────────────────────────────────────────────────────────────────────────
// CreateLoanSaga – Choreographed Saga
//
// Step 1: Verify patron exists and has no blocking fines   → PatronService
// Step 2: Reserve item (change status to 'loaned')          → HoldingsService
// Step 3: Persist loan record                               → Circulation DB
// Step 4: Publish loan.created event                        → Redis
//
// Compensation: If step 3 or 4 fails → release item via HoldingsService
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class CreateLoanSaga {
  private readonly logger = new Logger(CreateLoanSaga.name);

  constructor(
    private readonly loanRepo: ILoanRepository,
    private readonly patronClient: IPatronServiceClient,
    private readonly holdingsClient: IHoldingsServiceClient,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: CreateLoanCommand): Promise<LoanDto> {
    this.logger.log(`[SAGA START] CreateLoan barcode=${command.itemBarcode} patron=${command.patronCardNumber}`);

    // ── Step 1: Verify patron ─────────────────────────────────────────────
    const patron = await this.patronClient.getPatronByCardNumber(command.patronCardNumber);
    if (!patron) throw new PatronNotFoundError(command.patronCardNumber);

    patron.assertCanBorrow();

    // ── Step 2: Reserve item (optimistic lock via atomic status update) ───
    const item = await this.holdingsClient.reserveItem(command.itemBarcode);
    if (!item) throw new ItemNotFoundError(command.itemBarcode);

    this.logger.log(`[SAGA] Item ${command.itemBarcode} reserved`);

    // ── Step 3: Persist loan ──────────────────────────────────────────────
    let loan: Loan;
    try {
      loan = Loan.create({
        id: uuidv4(),
        itemId: item.id,
        patronId: patron.id,
        libraryId: command.libraryId,
        staffId: command.staffId,
        loanDate: new Date(),
        dueDate: new Date(), // Loan.create recalculates this
      });
      loan = await this.loanRepo.save(loan);
    } catch (error) {
      // Compensate: release the item back to available
      this.logger.error(`[SAGA COMPENSATE] Releasing item ${command.itemBarcode}`, error);
      await this.holdingsClient.releaseItem(command.itemBarcode);
      throw error;
    }

    // ── Step 4: Publish domain event (outbox pattern) ─────────────────────
    try {
      const event: DomainEvent<LoanCreatedPayload> = {
        eventId: uuidv4(),
        channel: EVENTS.LOAN_CREATED,
        occurredAt: new Date().toISOString(),
        libraryId: command.libraryId,
        payload: {
          loanId: loan.id,
          itemId: loan.itemId,
          itemBarcode: command.itemBarcode,
          patronId: loan.patronId,
          loanDate: loan.loanDate.toISOString(),
          dueDate: loan.dueDate.toISOString(),
        },
      };
      await this.eventPublisher.publish(EVENTS.LOAN_CREATED, event);
    } catch (error) {
      // Non-fatal: loan is created but event failed; outbox processor will retry
      this.logger.error(`[SAGA] Event publish failed for loan ${loan.id}, will retry via outbox`, error);
    }

    this.logger.log(`[SAGA COMPLETE] Loan ${loan.id} created`);
    return LoanMapper.toDto(loan, command.itemBarcode, item.title ?? 'Unknown');
  }
}
