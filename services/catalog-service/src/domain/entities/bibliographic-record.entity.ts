import { MaterialType } from '@biblioflow/shared-types';

// ─────────────────────────────────────────────────────────────────────────────
// BibliographicRecord – Aggregate Root
// Follows MARC21/Dublin Core bibliographic standards
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthorRef {
  id: string;
  name: string;
  dates: string | null;
  authorityId: string | null;
  role: string;
}

export interface SubjectRef {
  id: string;
  term: string;
  authorityId: string | null;
}

export interface RecordProps {
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
  libraryId: string;
  authors: AuthorRef[];
  subjects: SubjectRef[];
}

export class BibliographicRecord {
  private constructor(private readonly props: RecordProps) {}

  static create(props: RecordProps): BibliographicRecord {
    return new BibliographicRecord(props);
  }

  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get uniformTitle(): string | null { return this.props.uniformTitle; }
  get edition(): string | null { return this.props.edition; }
  get publicationYear(): number | null { return this.props.publicationYear; }
  get publisher(): string | null { return this.props.publisher; }
  get isbn(): string | null { return this.props.isbn; }
  get issn(): string | null { return this.props.issn; }
  get summary(): string | null { return this.props.summary; }
  get coverImageUrl(): string | null { return this.props.coverImageUrl; }
  get materialType(): MaterialType { return this.props.materialType; }
  get libraryId(): string { return this.props.libraryId; }
  get authors(): AuthorRef[] { return [...this.props.authors]; }
  get subjects(): SubjectRef[] { return [...this.props.subjects]; }

  get primaryAuthor(): AuthorRef | null {
    return this.props.authors.find((a) => a.role === 'author') ?? this.props.authors[0] ?? null;
  }

  update(partial: Partial<Omit<RecordProps, 'id' | 'libraryId'>>): BibliographicRecord {
    return new BibliographicRecord({ ...this.props, ...partial });
  }
}
