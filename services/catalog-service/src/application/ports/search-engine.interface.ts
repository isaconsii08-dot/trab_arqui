import { SearchFilters, SearchResult } from '@biblioflow/shared-types';

export interface ISearchEngine {
  search(filters: SearchFilters): Promise<SearchResult>;
  indexRecord(id: string): Promise<void>;
  deleteRecord(id: string): Promise<void>;
}

export const SEARCH_ENGINE = Symbol('ISearchEngine');
