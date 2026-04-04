import { LoanDto } from '@biblioflow/shared-types';
import { Loan } from '../../domain/entities/loan.entity';

export class LoanMapper {
  static toDto(loan: Loan, itemBarcode?: string, itemTitle?: string): LoanDto {
    return {
      id: loan.id,
      itemId: loan.itemId,
      patronId: loan.patronId,
      loanDate: loan.loanDate.toISOString(),
      dueDate: loan.dueDate.toISOString(),
      returnDate: loan.returnDate?.toISOString() ?? null,
      status: loan.status,
      renewedCount: loan.renewedCount,
      fineAmount: loan.fineAmount,
      itemBarcode: itemBarcode ?? loan.itemId,
      itemTitle: itemTitle ?? '',
    };
  }
}
