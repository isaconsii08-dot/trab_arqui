import { Injectable } from '@nestjs/common';
import { LoanStatus as PrismaLoanStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { Loan } from '../../domain/entities/loan.entity';
import { LoanStatus } from '@biblioflow/shared-types';

@Injectable()
export class PrismaLoanRepository implements ILoanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Loan | null> {
    const r = await this.prisma.loan.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findActiveLoanByItemBarcode(barcode: string): Promise<Loan | null> {
    const r = await this.prisma.loan.findFirst({
      where: { itemId: barcode, status: { in: ['active', 'overdue'] } },
    });
    return r ? this.toDomain(r) : null;
  }

  async findActiveLoansByPatron(patronId: string): Promise<Loan[]> {
    const records = await this.prisma.loan.findMany({
      where: { patronId, status: { in: ['active', 'overdue'] } },
      orderBy: { dueDate: 'asc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findLoansByPatron(
    patronId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Loan[]; total: number }> {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.prisma.loan.findMany({
        where: { patronId },
        skip,
        take: limit,
        orderBy: { loanDate: 'desc' },
      }),
      this.prisma.loan.count({ where: { patronId } }),
    ]);
    return { data: records.map((r) => this.toDomain(r)), total };
  }

  async findOverdueLoans(): Promise<Loan[]> {
    const records = await this.prisma.loan.findMany({
      where: { status: 'overdue' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(loan: Loan): Promise<Loan> {
    const data = {
      itemId: loan.itemId,
      patronId: loan.patronId,
      libraryId: loan.libraryId,
      staffId: loan.staffId,
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
      returnDate: loan.returnDate,
      status: loan.status as PrismaLoanStatus,
      renewedCount: loan.renewedCount,
    };
    const saved = await this.prisma.loan.upsert({
      where: { id: loan.id },
      create: { id: loan.id, ...data },
      update: data,
    });
    return this.toDomain(saved);
  }

  async countActiveByPatron(patronId: string): Promise<number> {
    return this.prisma.loan.count({
      where: { patronId, status: { in: ['active', 'overdue'] } },
    });
  }

  private toDomain(r: any): Loan {
    return Loan.reconstitute({
      id: r.id,
      itemId: r.itemId,
      patronId: r.patronId,
      libraryId: r.libraryId,
      staffId: r.staffId,
      loanDate: r.loanDate,
      dueDate: r.dueDate,
      returnDate: r.returnDate ?? null,
      status: r.status as LoanStatus,
      renewedCount: r.renewedCount,
      fineAmount: 0,
    });
  }
}
