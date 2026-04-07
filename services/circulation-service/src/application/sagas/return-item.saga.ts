import { Injectable, Inject, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LoanNotFoundError } from '@biblioflow/shared-errors';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { IHoldingsServiceClient } from '../ports/holdings-service-client.interface';
import { IPatronServiceClient, PATRON_SERVICE_CLIENT } from '../ports/patron-service-client.interface';
import { IEventPublisher } from '../ports/event-publisher.interface';
import { ReturnItemCommand } from '@biblioflow/shared-types';
import { EVENTS, LoanReturnedPayload, DomainEvent } from '@biblioflow/shared-events';
import { LoanDto } from '@biblioflow/shared-types';
import { LoanMapper } from '../mappers/loan.mapper';

@Injectable()
export class ReturnItemSaga {
  private readonly logger = new Logger(ReturnItemSaga.name);

  constructor(
    private readonly loanRepo: ILoanRepository,
    private readonly holdingsClient: IHoldingsServiceClient,
    @Inject(PATRON_SERVICE_CLIENT) private readonly patronClient: IPatronServiceClient,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(command: ReturnItemCommand): Promise<LoanDto> {
    this.logger.log(`[SAGA START] ReturnItem barcode=${command.itemBarcode}`);

    // ── Step 1: Find active loan by item barcode ──────────────────────────
    const activeLoan = await this.loanRepo.findActiveLoanByItemBarcode(command.itemBarcode);
    if (!activeLoan) throw new LoanNotFoundError(command.itemBarcode);

    // ── Step 2: Apply domain logic (calculate fine, mark returned) ────────
    const { loan: returnedLoan, fineAmount } = activeLoan.returnItem();

    // ── Step 3: Persist returned loan ─────────────────────────────────────
    const saved = await this.loanRepo.save(returnedLoan);

    // ── Step 4: Release item in Holdings Service ──────────────────────────
    await this.holdingsClient.releaseItem(command.itemBarcode);

    // ── Step 4b: Register fine in Patron Service if applicable ────────────
    if (fineAmount > 0) {
      await this.patronClient.createFine(
        saved.patronId,
        saved.id,
        fineAmount,
        `Devolución tardía — ${Math.round(fineAmount / 0.5)} día(s)`,
      );
    }

    // ── Step 5: Publish event ─────────────────────────────────────────────
    const event: DomainEvent<LoanReturnedPayload> = {
      eventId: uuidv4(),
      channel: EVENTS.LOAN_RETURNED,
      occurredAt: new Date().toISOString(),
      libraryId: saved.libraryId,
      payload: {
        loanId: saved.id,
        itemId: saved.itemId,
        patronId: saved.patronId,
        returnDate: saved.returnDate!.toISOString(),
        fineAmount,
      },
    };
    await this.eventPublisher.publish(EVENTS.LOAN_RETURNED, event);

    this.logger.log(`[SAGA COMPLETE] Return processed, fine=$${fineAmount} COP`);
    return LoanMapper.toDto(saved, command.itemBarcode, '');
  }
}
