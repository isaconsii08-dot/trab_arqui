import { BibliographicRecordDto } from '@biblioflow/shared-types';
import { BibliographicRecord } from '../../domain/entities/bibliographic-record.entity';

export class RecordMapper {
  static toDto(record: BibliographicRecord): BibliographicRecordDto {
    return {
      id: record.id,
      title: record.title,
      uniformTitle: record.uniformTitle,
      edition: record.edition,
      publicationYear: record.publicationYear,
      publisher: record.publisher,
      isbn: record.isbn,
      issn: record.issn,
      summary: record.summary,
      coverImageUrl: record.coverImageUrl,
      materialType: record.materialType,
      authors: record.authors,
      subjects: record.subjects,
      totalItems: 0,
      availableItems: 0,
    };
  }
}
