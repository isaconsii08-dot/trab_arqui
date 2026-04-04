import { Injectable } from '@nestjs/common';
import { ISearchEngine } from '../../application/ports/search-engine.interface';
import { SearchFilters, SearchResult } from '@biblioflow/shared-types';

/**
 * No-op search engine – delegates all searches to PostgreSQL via the repository.
 * Used when Elasticsearch is not configured.
 */
@Injectable()
export class NoopSearchEngine implements ISearchEngine {
  async search(_filters: SearchFilters): Promise<SearchResult> {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }

  async indexRecord(_id: string): Promise<void> {}

  async deleteRecord(_id: string): Promise<void> {}
}
