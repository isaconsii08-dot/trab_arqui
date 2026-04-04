import { Injectable, Logger } from '@nestjs/common';
import { SearchFilters, SearchResult } from '@biblioflow/shared-types';
import { ICatalogRepository } from '../../domain/repositories/catalog.repository.interface';
import { ISearchEngine } from '../ports/search-engine.interface';
import { RecordMapper } from '../mappers/record.mapper';

// ─────────────────────────────────────────────────────────────────────────────
// SearchCatalogUseCase
// Tries Elasticsearch first; falls back to PostgreSQL if ES is unavailable
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class SearchCatalogUseCase {
  private readonly logger = new Logger(SearchCatalogUseCase.name);

  constructor(
    private readonly catalogRepo: ICatalogRepository,
    private readonly searchEngine: ISearchEngine,
  ) {}

  async execute(filters: SearchFilters): Promise<SearchResult> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 20));

    try {
      const result = await this.searchEngine.search({ ...filters, page, limit });
      return result;
    } catch (error) {
      this.logger.warn('Elasticsearch unavailable, falling back to PostgreSQL search', error);
      const { data, total } = await this.catalogRepo.search({ ...filters, page, limit });
      return {
        data: data.map(RecordMapper.toDto),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }
  }
}
