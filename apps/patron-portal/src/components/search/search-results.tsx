import Link from 'next/link';
import { BookOpen, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { buscarCatalogo } from '@/lib/api';
import BookCover from '@/components/ui/book-cover';

const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://localhost:3003';

interface SearchResultsProps {
  filters: Record<string, string | undefined>;
}

async function obtenerDisponibilidad(recordIds: string[]): Promise<Record<string, { total: number; available: number }>> {
  if (recordIds.length === 0) return {};
  try {
    const res = await fetch(
      `${HOLDINGS_URL}/api/v1/holdings/availability?recordIds=${recordIds.join(',')}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return {};
    return res.json() as Promise<Record<string, { total: number; available: number }>>;
  } catch {
    return {};
  }
}

export default async function SearchResults({ filters }: SearchResultsProps) {
  const page = Number(filters.page ?? 1);
  const soloDisponibles = filters.available === 'true';

  // Pedir más resultados si filtramos por disponibilidad para compensar posibles exclusiones
  const limitBase = 12;
  const limitPeticion = soloDisponibles ? 40 : limitBase;

  const resultado = await buscarCatalogo({
    query: filters.query,
    subject: filters.subject,
    author: filters.author,
    yearFrom: filters.yearFrom ? Number(filters.yearFrom) : undefined,
    yearTo: filters.yearTo ? Number(filters.yearTo) : undefined,
    materialType: filters.materialType,
    page: soloDisponibles ? 1 : page,
    limit: limitPeticion,
  });

  const recordIds = resultado.data.map((r) => r.id);
  const disponibilidad = await obtenerDisponibilidad(recordIds);

  // Anotar cada registro con datos de disponibilidad reales
  let libros = resultado.data.map((r) => ({
    ...r,
    totalItems: disponibilidad[r.id]?.total ?? r.totalItems ?? 0,
    availableItems: disponibilidad[r.id]?.available ?? r.availableItems ?? 0,
  }));

  // Aplicar filtro de disponibilidad en el servidor
  if (soloDisponibles) {
    libros = libros.filter((r) => r.availableItems > 0);
  }

  const total = soloDisponibles ? libros.length : resultado.total;
  const totalPages = soloDisponibles ? Math.ceil(total / limitBase) : resultado.totalPages ?? Math.ceil(total / limitBase);
  const librosPagina = soloDisponibles ? libros.slice((page - 1) * limitBase, page * limitBase) : libros;

  if (librosPagina.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-ink/20" />
        <h3 className="font-display text-lg font-semibold text-ink">Sin resultados</h3>
        <p className="mt-2 font-body text-sm text-ink-muted">
          No encontramos títulos que coincidan con tu búsqueda.
        </p>
        <Link href="/search" className="btn-secondary mt-6 text-sm px-4 py-2">
          Ver todo el catálogo
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="font-body text-sm text-ink-muted">
          <span className="font-semibold text-ink">{total}</span>{' '}
          resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          {filters.query && <> para <span className="italic">&ldquo;{filters.query}&rdquo;</span></>}
        </p>
        <span className="font-mono text-xs text-ink-muted">Pág. {page} de {totalPages}</span>
      </div>

      <div className="space-y-4">
        {librosPagina.map((libro, idx) => {
          const autor = libro.authors.map((a) => a.name).join(', ') || 'Autor desconocido';
          const materias = libro.subjects.slice(0, 2).map((s) => s.term).join(', ');
          const disponible = libro.availableItems > 0;

          return (
            <Link
              key={libro.id}
              href={`/books/${libro.id}`}
              className="group flex gap-4 rounded-sm border border-ink/8 bg-white p-4 transition-all hover:border-amber-book/40 hover:shadow-sm"
            >
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-sm bg-parchment-dark">
                <BookCover
                  src={libro.coverImageUrl}
                  title={libro.title}
                  author={libro.authors[0]?.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                  colorIndex={idx}
                />
              </div>

              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold text-ink group-hover:text-amber-book transition-colors leading-snug line-clamp-2">
                      {libro.title}
                    </h3>
                    <span className={`ml-auto shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs ${disponible ? 'bg-emerald-pale text-emerald-library' : 'bg-rust/10 text-rust'}`}>
                      {disponible
                        ? <><CheckCircle className="h-3 w-3" /> Disponible ({libro.availableItems})</>
                        : <><XCircle className="h-3 w-3" /> Prestado</>}
                    </span>
                  </div>
                  <p className="mt-1 font-body text-sm text-ink-muted">{autor}</p>
                  {libro.summary && (
                    <p className="mt-2 font-body text-xs text-ink-muted line-clamp-2 leading-relaxed">{libro.summary}</p>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {materias && <span className="font-mono text-xs text-ink-muted">{materias}</span>}
                  {libro.publisher && <span className="font-mono text-xs text-ink-muted">&middot; {libro.publisher}</span>}
                  {libro.publicationYear && <span className="font-mono text-xs text-ink-muted">&middot; {libro.publicationYear}</span>}
                  {libro.isbn && <span className="font-mono text-xs text-ink-muted">&middot; ISBN {libro.isbn}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={{ query: { ...filters, page: String(page - 1) } }} className="flex items-center gap-1 rounded-sm border border-ink/15 px-3 py-2 font-mono text-xs text-ink hover:border-amber-book/40">
              <ChevronLeft className="h-3 w-3" /> Anterior
            </Link>
          )}
          <span className="font-mono text-xs text-ink-muted px-4">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={{ query: { ...filters, page: String(page + 1) } }} className="flex items-center gap-1 rounded-sm border border-ink/15 px-3 py-2 font-mono text-xs text-ink hover:border-amber-book/40">
              Siguiente <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
