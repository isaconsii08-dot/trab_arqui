import { BookOpen, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { RefreshButton } from '@/components/ui/refresh-button';
import Link from 'next/link';
import Image from 'next/image';
import { listarCatalogo } from '@/lib/api';

interface PageProps {
  searchParams: Promise<{ page?: string; query?: string }>;
}

interface CatalogRecord {
  id: string;
  title: string;
  isbn: string | null;
  publicationYear: number | null;
  publisher: string | null;
  materialType: string;
  coverImageUrl: string | null;
  authors: Array<{ id: string; name: string; role: string }>;
  subjects: Array<{ id: string; term: string }>;
  totalItems: number;
  availableItems: number;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const query = params.query ?? '';

  const resultado = await listarCatalogo({
    limit: 8,
    page,
    ...(query ? { query } : {}),
  }).catch(() => ({ data: [] as CatalogRecord[], total: 0 }));

  const libros = resultado.data as CatalogRecord[];
  const totalPages = Math.ceil(resultado.total / 8);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Catálogo</h1>
          <p className="font-mono text-xs text-text-muted">
            {resultado.total.toLocaleString()} materiales registrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link href="/catalog/new" className="btn-green">
            <BookOpen className="h-4 w-4" />
            Añadir material
          </Link>
        </div>
      </div>

      {/* Búsqueda */}
      <form method="get" className="flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-sm border border-surface-border bg-surface-raised px-3 py-2.5">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            name="query"
            type="search"
            defaultValue={query}
            placeholder="Buscar por título, autor o ISBN..."
            className="flex-1 bg-transparent font-body text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
        </div>
        <button type="submit" className="btn-green">
          Buscar
        </button>
      </form>

      {/* Grid de libros */}
      {libros.length === 0 ? (
        <div className="surface-card flex flex-col items-center py-16 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-text-muted/30" />
          <p className="font-mono text-sm text-text-muted">No se encontraron materiales</p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="w-12"></th>
                <th>Título</th>
                <th>Autor(es)</th>
                <th>ISBN</th>
                <th>Año</th>
                <th>Ejemplares</th>
                <th>Disponibles</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {libros.map((libro) => (
                <tr key={libro.id} className="table-row">
                  <td>
                    <div className="relative h-12 w-9 overflow-hidden rounded-sm bg-surface-raised">
                      {libro.coverImageUrl ? (
                        <Image
                          src={libro.coverImageUrl}
                          alt={libro.title}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <BookOpen className="absolute inset-0 m-auto h-4 w-4 text-text-muted/40" />
                      )}
                    </div>
                  </td>
                  <td className="max-w-[200px]">
                    <p className="truncate font-medium text-text-primary">{libro.title}</p>
                    {libro.subjects?.[0] && (
                      <p className="truncate font-mono text-xs text-text-muted">{libro.subjects[0].term}</p>
                    )}
                  </td>
                  <td className="max-w-[150px] truncate text-text-secondary">
                    {libro.authors.map((a) => a.name).join(', ') || '—'}
                  </td>
                  <td className="font-mono text-xs text-text-muted">{libro.isbn ?? '—'}</td>
                  <td className="font-mono text-xs text-text-muted">{libro.publicationYear ?? '—'}</td>
                  <td className="font-mono text-sm text-text-secondary">{libro.totalItems}</td>
                  <td>
                    <span className={`font-mono text-sm font-medium ${
                      libro.availableItems > 0 ? 'text-accent-green' : 'text-accent-red'
                    }`}>
                      {libro.availableItems}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/catalog/${libro.id}`}
                      className="font-mono text-xs text-accent-green hover:underline"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-text-muted">
            Página {page} de {totalPages} · {resultado.total} materiales
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={`/catalog?page=${page - 1}${query ? `&query=${encodeURIComponent(query)}` : ''}`}
              aria-disabled={page === 1}
              className={`flex h-7 w-7 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:bg-surface-raised ${page === 1 ? 'pointer-events-none opacity-30' : ''}`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/catalog?page=${p}${query ? `&query=${encodeURIComponent(query)}` : ''}`}
                className={`flex h-7 w-7 items-center justify-center rounded-sm border font-mono text-xs transition-colors ${
                  p === page
                    ? 'border-accent-green bg-accent-green/10 text-accent-green'
                    : 'border-surface-border text-text-muted hover:bg-surface-raised'
                }`}
              >
                {p}
              </Link>
            ))}
            <Link
              href={`/catalog?page=${page + 1}${query ? `&query=${encodeURIComponent(query)}` : ''}`}
              aria-disabled={page === totalPages}
              className={`flex h-7 w-7 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:bg-surface-raised ${page === totalPages ? 'pointer-events-none opacity-30' : ''}`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
