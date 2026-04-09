export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { SlidersHorizontal, BookOpen } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import SearchBar from '@/components/search/search-bar';
import SearchFiltersPanel from '@/components/search/search-filters';
import SearchResults from '@/components/search/search-results';

interface SearchPageProps {
  searchParams: Promise<{
    query?: string;
    author?: string;
    subject?: string;
    yearFrom?: string;
    yearTo?: string;
    materialType?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  return {
    title: params.query ? `"${params.query}" — Catálogo` : 'Buscar en el catálogo',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        {/* Search header */}
        <div className="border-b border-ink/8 bg-parchment-light py-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="section-label">Catálogo bibliográfico</span>
            </div>
            {params.query && (
              <h1 className="heading-md mb-6 text-ink">
                Resultados para{' '}
                <span className="italic text-amber-book">&ldquo;{params.query}&rdquo;</span>
              </h1>
            )}
            <SearchBar defaultValue={params.query ?? ''} />
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex gap-8">
            {/* Filters sidebar */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24">
                <div className="mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-ink-muted" />
                  <span className="font-body text-sm font-medium text-ink">Filtros</span>
                </div>
                <SearchFiltersPanel currentFilters={params} />
              </div>
            </aside>

            {/* Results */}
            <main className="flex-1">
              <Suspense fallback={<SearchResultsSkeleton />}>
                <SearchResults filters={params} />
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card flex gap-4 p-5">
          <div className="skeleton h-28 w-20 rounded-sm" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-4 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
