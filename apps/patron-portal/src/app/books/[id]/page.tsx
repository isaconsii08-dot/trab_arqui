import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Calendar, Building, Tag, Hash } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import BookCover from '@/components/ui/book-cover';
import LoanButton from './loan-button';
import { obtenerLibro, obtenerEjemplaresLibro } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const libro = await obtenerLibro(id);
  if (!libro) return { title: 'Libro no encontrado – BiblioFlow' };
  return {
    title: `${libro.title} – BiblioFlow`,
    description: libro.summary ?? `Consulta disponibilidad de ${libro.title}`,
  };
}

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params;
  const [libro, ejemplares] = await Promise.all([
    obtenerLibro(id),
    obtenerEjemplaresLibro(id),
    new Promise<void>((r) => setTimeout(r, 500)),
  ]);

  if (!libro) notFound();

  const autores = libro.authors.map((a) => a.name).join(', ') || 'Autor desconocido';
  const materias = libro.subjects.map((s) => s.term);
  const disponible = ejemplares.disponibles > 0;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-5xl px-6 py-10">

          <Link
            href="/search"
            className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-ink-muted hover:text-amber-book transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Volver al catálogo
          </Link>

          <div className="grid gap-10 md:grid-cols-[280px_1fr]">
            {/* Portada */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-parchment-dark shadow-md">
                <BookCover
                  src={libro.coverImageUrl}
                  title={libro.title}
                  author={libro.authors[0]?.name}
                  fill
                  sizes="280px"
                  className="object-cover"
                />
              </div>

              {/* Disponibilidad */}
              <div className={`rounded-sm border p-4 text-center ${disponible ? 'border-emerald-library/30 bg-emerald-pale' : 'border-rust/20 bg-rust/5'}`}>
                <div className={`flex items-center justify-center gap-2 font-body text-sm font-medium ${disponible ? 'text-emerald-library' : 'text-rust'}`}>
                  {disponible ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {disponible ? 'Disponible para préstamo' : 'Todos los ejemplares prestados'}
                </div>
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  {ejemplares.disponibles} de {ejemplares.total} ejemplar{ejemplares.total !== 1 ? 'es' : ''} disponible{ejemplares.disponibles !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Detalles */}
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {materias.map((m) => (
                  <Link
                    key={m}
                    href={`/search?subject=${encodeURIComponent(m)}`}
                    className="rounded-full bg-amber-book/10 px-3 py-1 font-mono text-xs text-amber-book hover:bg-amber-book/20 transition-colors"
                  >
                    {m}
                  </Link>
                ))}
              </div>

              <h1 className="font-display text-3xl font-semibold leading-tight text-ink">
                {libro.title}
              </h1>
              <p className="mt-2 font-body text-lg text-ink-muted">{autores}</p>

              {libro.summary && (
                <div className="mt-6">
                  <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                    Sinopsis
                  </h2>
                  <p className="font-body text-base leading-relaxed text-ink/80">{libro.summary}</p>
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 gap-4 rounded-sm border border-ink/8 bg-parchment-light p-5">
                {[
                  { icon: Calendar, label: 'Año de publicación', value: libro.publicationYear ?? '—' },
                  { icon: Building, label: 'Editorial',          value: libro.publisher ?? '—' },
                  { icon: Hash,     label: 'ISBN',                value: libro.isbn ?? '—' },
                  { icon: Tag,      label: 'Tipo de material',    value: libro.materialType === 'book' ? 'Libro' : libro.materialType },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-book" />
                    <div>
                      <div className="font-mono text-xs text-ink-muted">{label}</div>
                      <div className="font-body text-sm text-ink">{String(value)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {ejemplares.total > 0 && (
                <div className="mt-8">
                  <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                    Ejemplares en la biblioteca
                  </h2>
                  <div className="space-y-2">
                    {(ejemplares.items as Array<{ barcode: string; location: string; status: string; callNumber?: string }>).map((ej) => {
                      const disponible = ej.status === 'available';
                      return (
                        <div key={ej.barcode} className="flex items-center gap-4 rounded-sm border border-ink/8 bg-parchment-light px-4 py-3">
                          {/* Indicador de estado */}
                          <div className={`h-2 w-2 shrink-0 rounded-full ${disponible ? 'bg-emerald-library' : 'bg-rust/60'}`} />

                          {/* Info principal */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-semibold text-ink">{ej.barcode}</span>
                              <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${disponible ? 'bg-emerald-pale text-emerald-library' : 'bg-rust/10 text-rust'}`}>
                                {disponible ? 'Disponible' : 'En préstamo'}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              <span className="flex items-center gap-1 font-body text-xs text-ink-muted">
                                <Building className="h-3 w-3 shrink-0" />
                                {ej.location}
                              </span>
                              {ej.callNumber && (
                                <span className="font-mono text-[10px] text-ink-muted/70">
                                  Signatura: {ej.callNumber}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Acción */}
                          <div className="shrink-0">
                            {disponible ? (
                              <LoanButton bookId={id} bookTitle={libro.title} itemBarcode={ej.barcode} variant="inline" />
                            ) : (
                              <span className="font-mono text-xs text-ink-muted/50">No disponible</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
