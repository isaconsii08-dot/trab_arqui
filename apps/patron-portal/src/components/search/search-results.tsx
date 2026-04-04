import Link from 'next/link';
import { BookOpen, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Mock data for demo purposes ─────────────────────────────────────────────
const MOCK_RESULTS = [
  { id: '1', title: 'Cien años de soledad', author: 'Gabriel García Márquez', year: 1967, publisher: 'Editorial Sudamericana', materialType: 'book', isbn: '978-0-06-088328-7', subject: 'Realismo mágico', availableItems: 3, totalItems: 4 },
  { id: '2', title: 'El nombre de la rosa', author: 'Umberto Eco', year: 1980, publisher: 'Lumen', materialType: 'book', isbn: '978-84-264-1711-5', subject: 'Novela histórica', availableItems: 0, totalItems: 2 },
  { id: '3', title: 'Sapiens: De animales a dioses', author: 'Yuval Noah Harari', year: 2011, publisher: 'Debate', materialType: 'book', isbn: '978-84-9992-422-1', subject: 'Historia', availableItems: 1, totalItems: 3 },
  { id: '4', title: 'La casa de los espíritus', author: 'Isabel Allende', year: 1982, publisher: 'Plaza & Janés', materialType: 'book', isbn: '978-84-01-38336-9', subject: 'Literatura latinoamericana', availableItems: 2, totalItems: 2 },
  { id: '5', title: 'Ficciones', author: 'Jorge Luis Borges', year: 1944, publisher: 'Sur', materialType: 'book', isbn: '978-84-206-0150-9', subject: 'Literatura latinoamericana', availableItems: 1, totalItems: 2 },
];

interface SearchResultsProps {
  filters: Record<string, string | undefined>;
}

export default async function SearchResults({ filters }: SearchResultsProps) {
  // In production, this would call: searchCatalogUseCase.execute(filters)
  const results = MOCK_RESULTS;
  const total = results.length;

  return (
    <div>
      {/* Results summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="font-body text-sm text-ink-muted">
          <span className="font-semibold text-ink">{total}</span> resultados encontrados
          {filters.query && (
            <> para <span className="italic">"{filters.query}"</span></>
          )}
        </p>
        <select className="rounded-sm border border-ink/15 bg-transparent px-3 py-2 font-mono text-xs text-ink focus:outline-none">
          <option>Relevancia</option>
          <option>Título (A–Z)</option>
          <option>Año (más reciente)</option>
          <option>Disponibilidad</option>
        </select>
      </div>

      {/* Results list */}
      {results.length === 0 ? (
        <EmptyState query={filters.query} />
      ) : (
        <div className="space-y-3">
          {results.map((item) => (
            <Link
              key={item.id}
              href={`/catalog/${item.id}`}
              className="card-hover group flex gap-5 p-5"
            >
              {/* Cover thumbnail */}
              <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-sm bg-parchment-dark">
                <BookOpen className="h-7 w-7 text-ink/25" />
              </div>

              {/* Record info */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-base font-semibold text-ink group-hover:text-amber-book transition-colors leading-snug">
                        {item.title}
                      </h2>
                      <p className="mt-0.5 font-body text-sm text-ink-muted">{item.author}</p>
                    </div>
                    {item.availableItems > 0 ? (
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-pale px-3 py-1 font-mono text-xs text-emerald-library">
                        <CheckCircle className="h-3 w-3" />
                        Disponible
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-rust/8 px-3 py-1 font-mono text-xs text-rust">
                        <XCircle className="h-3 w-3" />
                        Prestado
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-body text-sm text-ink-muted line-clamp-2">
                    {item.subject} · {item.publisher}, {item.year}
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <span className="font-mono text-xs text-ink-muted">ISBN: {item.isbn}</span>
                  <span className="font-mono text-xs text-ink-muted">
                    {item.availableItems}/{item.totalItems} ejemplares
                  </span>
                  <span
                    className="rounded-sm border border-ink/15 px-2 py-0.5 font-mono text-xs text-ink-muted"
                  >
                    {item.materialType === 'book' ? 'Libro' : item.materialType}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-sm border border-ink/15 text-ink-muted hover:border-ink hover:text-ink transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className={`h-9 w-9 rounded-sm font-mono text-sm transition-colors ${
                p === 1
                  ? 'bg-ink text-parchment'
                  : 'border border-ink/15 text-ink-muted hover:border-ink hover:text-ink'
              }`}
            >
              {p}
            </button>
          ))}
          <button className="flex h-9 w-9 items-center justify-center rounded-sm border border-ink/15 text-ink-muted hover:border-ink hover:text-ink transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <BookOpen className="mb-4 h-12 w-12 text-ink/20" />
      <h3 className="font-display text-lg font-semibold text-ink">
        {query ? `Sin resultados para "${query}"` : 'Sin resultados'}
      </h3>
      <p className="mt-2 text-sm text-ink-muted max-w-sm">
        Prueba con otros términos de búsqueda o ajusta los filtros para encontrar lo que buscas.
      </p>
    </div>
  );
}
