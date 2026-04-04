import { Injectable } from '@nestjs/common';
import { RecordNotFoundError } from '@biblioflow/shared-errors';
import { BibliographicRecordDto } from '@biblioflow/shared-types';
import { ICatalogRepository } from '../../domain/repositories/catalog.repository.interface';
import { RecordMapper } from '../mappers/record.mapper';

@Injectable()
export class GetRecordUseCase {
  constructor(private readonly catalogRepo: ICatalogRepository) {}

  async execute(id: string): Promise<BibliographicRecordDto> {
    const record = await this.catalogRepo.findById(id);
    if (!record) throw new RecordNotFoundError(id);
    return RecordMapper.toDto(record);
  }
}
