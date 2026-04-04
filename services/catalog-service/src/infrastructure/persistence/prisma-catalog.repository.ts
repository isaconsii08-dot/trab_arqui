import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { ICatalogRepository } from '../../domain/repositories/catalog.repository.interface';
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
      where: { isbn },
      include: {
        recordAuthors: { include: { author: true } },
        recordSubjects: { include: { subject: true } },
      },
    });
    if (!r) return null;
    return this.toDomain(r);
  }

  async search(filters: SearchFilters): Promise<{ data: BibliographicRecord[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (filters.query) {
      where['OR'] = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { summary: { contains: filters.query, mode: 'insensitive' } },
      ];
    }
    if (filters.materialType) where['materialType'] = filters.materialType;
    if (filters.yearFrom ?? filters.yearTo) {
      where['publicationYear'] = {
        ...(filters.yearFrom ? { gte: Number(filters.yearFrom) } : {}),
        ...(filters.yearTo ? { lte: Number(filters.yearTo) } : {}),
      };
    }

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

  async delete(id: string): Promise<void> {
    await this.prisma.bibliographicRecord.delete({ where: { id } });
  }

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
      authors: r.recordAuthors?.map((ra: any) => ({
        id: ra.author.id,
        name: ra.author.name,
        dates: ra.author.dates ?? null,
        authorityId: ra.author.authorityId ?? null,
        role: ra.role,
      })) ?? [],
      subjects: r.recordSubjects?.map((rs: any) => ({
        id: rs.subject.id,
        term: rs.subject.term,
        authorityId: rs.subject.authorityId ?? null,
      })) ?? [],
    });
  }
}
