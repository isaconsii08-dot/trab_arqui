import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IPatronRepository } from '../../domain/repositories/patron.repository.interface';
import { Patron } from '../../domain/entities/patron.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { CardNumber } from '../../domain/value-objects/card-number.vo';
import { Prisma } from '../../generated/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// PrismaPatronRepository – Infrastructure Adapter
// Translates between Prisma models and domain entities
// ─────────────────────────────────────────────────────────────────────────────

type PatronWithFines = Prisma.PatronGetPayload<{ include: { fines: true } }>;

@Injectable()
export class PrismaPatronRepository implements IPatronRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Patron | null> {
    const record = await this.prisma.patron.findUnique({
      where: { id },
      include: { fines: { where: { status: 'pending' } } },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Patron | null> {
    const record = await this.prisma.patron.findUnique({
      where: { email },
      include: { fines: { where: { status: 'pending' } } },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByCardNumber(cardNumber: string): Promise<Patron | null> {
    const record = await this.prisma.patron.findUnique({
      where: { cardNumber },
      include: { fines: { where: { status: 'pending' } } },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAllByLibrary(
    libraryId: string,
    page: number,
    limit: number,
    query?: string,
  ): Promise<{ data: Patron[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = query
      ? {
          libraryId,
          OR: [
            { fullName:   { contains: query, mode: 'insensitive' as const } },
            { email:      { contains: query, mode: 'insensitive' as const } },
            { cardNumber: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : { libraryId };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.patron.findMany({
        where,
        include: { fines: { where: { status: 'pending' } } },
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.patron.count({ where }),
    ]);
    return { data: records.map((r) => this.toDomain(r)), total };
  }

  async save(patron: Patron): Promise<Patron> {
    const data = {
      libraryId: patron.libraryId,
      cardNumber: patron.cardNumber.toString(),
      fullName: patron.fullName,
      email: patron.email.toString(),
      phone: patron.phone,
      address: patron.address,
      passwordHash: patron.passwordHash,
      status: patron.status,
    };

    const record = await this.prisma.patron.upsert({
      where: { id: patron.id },
      create: { id: patron.id, ...data },
      update: data,
      include: { fines: { where: { status: 'pending' } } },
    });

    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.patron.delete({ where: { id } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.patron.count({ where: { email } });
    return count > 0;
  }

  async existsByCardNumber(cardNumber: string): Promise<boolean> {
    const count = await this.prisma.patron.count({ where: { cardNumber } });
    return count > 0;
  }

  private toDomain(record: PatronWithFines): Patron {
    const pendingFinesAmount = record.fines.reduce(
      (sum: number, f: { amount: unknown }) => sum + Number(f.amount),
      0,
    );
    return Patron.create({
      id: record.id,
      libraryId: record.libraryId,
      cardNumber: CardNumber.create(record.cardNumber),
      fullName: record.fullName,
      email: Email.create(record.email),
      phone: record.phone,
      address: record.address,
      passwordHash: record.passwordHash,
      registrationDate: record.registrationDate,
      status: record.status,
      pendingFinesAmount,
    });
  }
}
