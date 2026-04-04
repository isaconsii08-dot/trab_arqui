import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { EmailAlreadyRegisteredError, CardNumberAlreadyExistsError } from '@biblioflow/shared-errors';
import { Patron } from '../../domain/entities/patron.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { CardNumber } from '../../domain/value-objects/card-number.vo';
import { IPatronRepository, PATRON_REPOSITORY } from '../../domain/repositories/patron.repository.interface';
import { IEventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.interface';
import { EVENTS, PatronRegisteredPayload, DomainEvent } from '@biblioflow/shared-events';
import { RegisterPatronDto } from '../dtos/register-patron.dto';
import { PatronDto } from '@biblioflow/shared-types';
import { PatronMapper } from '../mappers/patron.mapper';

// ─────────────────────────────────────────────────────────────────────────────
// RegisterPatronUseCase
// Validates uniqueness, hashes password, persists, and publishes domain event
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RegisterPatronUseCase {
  constructor(
    @Inject(PATRON_REPOSITORY) private readonly patronRepo: IPatronRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: RegisterPatronDto): Promise<PatronDto> {
    const email = Email.create(dto.email);
    const cardNumber = CardNumber.generate(dto.libraryId.slice(0, 3));

    const [emailTaken, cardTaken] = await Promise.all([
      this.patronRepo.existsByEmail(email.toString()),
      this.patronRepo.existsByCardNumber(cardNumber.toString()),
    ]);

    if (emailTaken) throw new EmailAlreadyRegisteredError(email.toString());
    if (cardTaken) throw new CardNumberAlreadyExistsError(cardNumber.toString());

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const patron = Patron.create({
      id: uuidv4(),
      libraryId: dto.libraryId,
      cardNumber,
      fullName: dto.fullName,
      email,
      phone: dto.phone ?? null,
      address: dto.address ?? null,
      passwordHash,
      registrationDate: new Date(),
      status: 'active',
      pendingFinesAmount: 0,
    });

    const saved = await this.patronRepo.save(patron);

    const event: DomainEvent<PatronRegisteredPayload> = {
      eventId: uuidv4(),
      channel: EVENTS.PATRON_REGISTERED,
      occurredAt: new Date().toISOString(),
      libraryId: dto.libraryId,
      payload: {
        patronId: saved.id,
        libraryId: saved.libraryId,
        email: saved.email.toString(),
        fullName: saved.fullName,
        cardNumber: saved.cardNumber.toString(),
      },
    };

    await this.eventPublisher.publish(EVENTS.PATRON_REGISTERED, event);

    return PatronMapper.toDto(saved);
  }
}
