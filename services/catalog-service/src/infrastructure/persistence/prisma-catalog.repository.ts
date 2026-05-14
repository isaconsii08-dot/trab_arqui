import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ICatalogRepository, AuthorInput } from '../../domain/repositories/catalog.repository.interface';
import { BibliographicRecord } from '../../domain/entities/bibliographic-record.entity';
import { SearchFilters } from '@biblioflow/shared-types';

@Injectable()
export class PrismaCatalogRepository implements ICatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<BibliographicRecord | null> {
    const r = await this.prisma.bibliographicRecord.findUnique({
      where: { id },
      include: {
        recordAuthors: { include: { author: true } },
        recordSubjects: { include: { subject: true } },
      },
    });
    if (!r) return null;
    return this.toDomain(r);
  }

  async findByIsbn(isbn: string): Promise<BibliographicRecord | null> {
    const r = await this.prisma.bibliographicRecord.findFirst({
      where: { isbn, isActive: true },
      include: {
        recordAuthors: { include: { author: true } },
        recordSubjects: { include: { subject: true } },
      },
    });
    if (!r) return null;
    return this.toDomain(r);
  }

  async search(filters: SearchFilters): Promise<{ data: BibliographicRecord[]; total: number }> {
    const andConditions: object[] = [];

    if (filters.query) {
      andConditions.push({
        OR: [
          { title: { contains: filters.query, mode: 'insensitive' } },
          { summary: { contains: filters.query, mode: 'insensitive' } },
          { publisher: { contains: filters.query, mode: 'insensitive' } },
          { isbn: { contains: filters.query, mode: 'insensitive' } },
          { recordAuthors: { some: { author: { name: { contains: filters.query, mode: 'insensitive' } } } } },
        ],
      });
    }

    if (filters.author) {
      andConditions.push({
        recordAuthors: { some: { author: { name: { contains: filters.author, mode: 'insensitive' } } } },
      });
    }

    if (filters.subject) {
      andConditions.push({
        recordSubjects: { some: { subject: { term: { contains: filters.subject, mode: 'insensitive' } } } },
      });
    }

    if (filters.materialType) {
      andConditions.push({ materialType: filters.materialType });
    }

    if (filters.yearFrom ?? filters.yearTo) {
      andConditions.push({
        publicationYear: {
          ...(filters.yearFrom ? { gte: Number(filters.yearFrom) } : {}),
          ...(filters.yearTo   ? { lte: Number(filters.yearTo)   } : {}),
        },
      });
    }

    const showInactive = filters.inactive === true || (filters.inactive as unknown) === 'true' || (filters.inactive as unknown) === '1';
    andConditions.push({ isActive: !showInactive });
    const where = { AND: andConditions };

    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 20);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.bibliographicRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          recordAuthors: { include: { author: true } },
          recordSubjects: { include: { subject: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bibliographicRecord.count({ where }),
    ]);

    return { data: data.map((r) => this.toDomain(r)), total };
  }

  async save(record: BibliographicRecord): Promise<BibliographicRecord> {
    const saved = await this.prisma.bibliographicRecord.upsert({
      where: { id: record.id },
      update: {
        title: record.title,
        uniformTitle: record.uniformTitle ?? null,
        edition: record.edition ?? null,
        publicationYear: record.publicationYear ?? null,
        publisher: record.publisher ?? null,
        isbn: record.isbn ?? null,
        issn: record.issn ?? null,
        summary: record.summary ?? null,
        coverImageUrl: record.coverImageUrl ?? null,
        materialType: record.materialType,
        libraryId: record.libraryId,
      },
      create: {
        id: record.id,
        title: record.title,
        uniformTitle: record.uniformTitle ?? null,
        edition: record.edition ?? null,
        publicationYear: record.publicationYear ?? null,
        publisher: record.publisher ?? null,
        isbn: record.isbn ?? null,
        issn: record.issn ?? null,
        summary: record.summary ?? null,
        coverImageUrl: record.coverImageUrl ?? null,
        materialType: record.materialType,
        libraryId: record.libraryId,
      },
      include: {
        recordAuthors: { include: { author: true } },
        recordSubjects: { include: { subject: true } },
      },
    });
    return this.toDomain(saved);
  }

  async saveWithRelations(
    record: BibliographicRecord,
    authors: AuthorInput[],
    subjectTerms: string[],
  ): Promise<BibliographicRecord> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert el registro principal
      await tx.bibliographicRecord.upsert({
        where: { id: record.id },
        update: {
          title: record.title,
          uniformTitle: record.uniformTitle ?? null,
          edition: record.edition ?? null,
          publicationYear: record.publicationYear ?? null,
          publisher: record.publisher ?? null,
          isbn: record.isbn ?? null,
          issn: record.issn ?? null,
          summary: record.summary ?? null,
          coverImageUrl: record.coverImageUrl ?? null,
          materialType: record.materialType,
          libraryId: record.libraryId,
        },
        create: {
          id: record.id,
          title: record.title,
          uniformTitle: record.uniformTitle ?? null,
          edition: record.edition ?? null,
          publicationYear: record.publicationYear ?? null,
          publisher: record.publisher ?? null,
          isbn: record.isbn ?? null,
          issn: record.issn ?? null,
          summary: record.summary ?? null,
          coverImageUrl: record.coverImageUrl ?? null,
          materialType: record.materialType,
          libraryId: record.libraryId,
        },
      });

      // 2. Reemplazar relaciones de autores
      await tx.recordAuthor.deleteMany({ where: { recordId: record.id } });
      for (const input of authors) {
        let author = await tx.author.findFirst({ where: { name: input.name } });
        if (!author) {
          author = await tx.author.create({
            data: { name: input.name, dates: input.dates ?? null },
          });
        }
        await tx.recordAuthor.create({
          data: { recordId: record.id, authorId: author.id, role: input.role ?? 'author' },
        });
      }

      // 3. Reemplazar relaciones de materias
      await tx.recordSubject.deleteMany({ where: { recordId: record.id } });
      for (const term of subjectTerms) {
        let subject = await tx.subject.findFirst({ where: { term } });
        if (!subject) {
          subject = await tx.subject.create({ data: { term } });
        }
        await tx.recordSubject.create({
          data: { recordId: record.id, subjectId: subject.id },
        });
      }

      // 4. Retornar el registro completo con relaciones
      const saved = await tx.bibliographicRecord.findUnique({
        where: { id: record.id },
        include: {
          recordAuthors: { include: { author: true } },
          recordSubjects: { include: { subject: true } },
        },
      });
      return this.toDomain(saved!);
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.bibliographicRecord.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string): Promise<void> {
    await this.prisma.bibliographicRecord.update({
      where: { id },
      data: { isActive: true },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(r: any): BibliographicRecord {
    return BibliographicRecord.create({
      id: r.id,
      title: r.title,
      uniformTitle: r.uniformTitle ?? null,
      edition: r.edition ?? null,
      publicationYear: r.publicationYear ?? null,
      publisher: r.publisher ?? null,
      isbn: r.isbn ?? null,
      issn: r.issn ?? null,
      summary: r.summary ?? null,
      coverImageUrl: r.coverImageUrl ?? null,
      materialType: r.materialType,
      libraryId: r.libraryId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authors: r.recordAuthors?.map((ra: any) => ({
        id: ra.author.id,
        name: ra.author.name,
        dates: ra.author.dates ?? null,
        authorityId: ra.author.authorityId ?? null,
        role: ra.role,
      })) ?? [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subjects: r.recordSubjects?.map((rs: any) => ({
        id: rs.subject.id,
        term: rs.subject.term,
        authorityId: rs.subject.authorityId ?? null,
      })) ?? [],
    });
  }
}
