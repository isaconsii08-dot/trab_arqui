import { BibliographicRecord } from '../entities/bibliographic-record.entity';
import { SearchFilters } from '@biblioflow/shared-types';

export interface AuthorInput {
  name: string;
  dates?: string | null;
  role?: string;
}

export interface ICatalogRepository {
  findById(id: string): Promise<BibliographicRecord | null>;
  findByIsbn(isbn: string): Promise<BibliographicRecord | null>;
  search(filters: SearchFilters): Promise<{ data: BibliographicRecord[]; total: number }>;
  save(record: BibliographicRecord): Promise<BibliographicRecord>;
  saveWithRelations(
    record: BibliographicRecord,
    authors: AuthorInput[],
    subjectTerms: string[],
  ): Promise<BibliographicRecord>;
  delete(id: string): Promise<void>;
}

export const CATALOG_REPOSITORY = Symbol('ICatalogRepository');
