import { PatronDto } from '@biblioflow/shared-types';
import { Patron } from '../../domain/entities/patron.entity';

export class PatronMapper {
  static toDto(patron: Patron): PatronDto {
    return {
      id: patron.id,
      libraryId: patron.libraryId,
      cardNumber: patron.cardNumber.toString(),
      fullName: patron.fullName,
      email: patron.email.toString(),
      phone: patron.phone,
      address: patron.address,
      registrationDate: patron.registrationDate.toISOString(),
      status: patron.status,
      pendingFinesTotal: patron.pendingFinesAmount,
    };
  }
}
