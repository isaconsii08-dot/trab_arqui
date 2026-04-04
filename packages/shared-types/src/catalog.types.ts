// ─────────────────────────────────────────────────────────────────────────────
// Catalog Service – Shared Types
// ─────────────────────────────────────────────────────────────────────────────

export type MaterialType = 'book' | 'journal' | 'audiovisual' | 'map' | 'archive' | 'digital';

export interface AuthorDto {
  id: string;
  name: string;
  dates: string | null;
  authorityId: string | null;
}

export interface SubjectDto {
  id: string;
  term: string;
  authorityId: string | null;
}

export interface BibliographicRecordDto {
  id: string;
  title: string;
  uniformTitle: string | null;
  edition: string | null;
  publicationYear: number | null;
  publisher: string | null;
  isbn: string | null;
  issn: string | null;
  summary: string | null;
  coverImageUrl: string | null;
  materialType: MaterialType;
  authors: AuthorDto[];
  subjects: SubjectDto[];
  totalItems: number;
  availableItems: number;
}

export interface SearchFilters {
  query?: string;
  author?: string;
  subject?: string;
  yearFrom?: number;
  yearTo?: number;
  materialType?: MaterialType;
  available?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  data: BibliographicRecordDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
