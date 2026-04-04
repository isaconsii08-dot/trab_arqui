import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, MapPin, ArrowRight, Library, BookMarked, Star } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import SearchBar from '@/components/search/search-bar';
import { buscarCatalogo } from '@/lib/api';

const categorias = [
  { name: 'Literatura', subject: 'Literatura', count: null, icon: BookOpen },
  { name: 'Historia', subject: 'Historia', count: null, icon: BookMarked },
  { name: 'Ciencias', subject: 'Ciencias', count: null, icon: Star },
  { name: 'Filosofía', subject: 'Filosofía', count: null, icon: Library },
];

export default async function HomePage() {
  // Portada: últimos 8 libros ingresados
  const destacados = await buscarCatalogo({ limit: 8, page: 1 });

  // Conteos por materia
  const [litRes, histRes, cienRes, filosRes, totalItems] = await Promise.all([
    buscarCatalogo({ subject: 'Literatura', limit: 1 }),
    buscarCatalogo({ subject: 'Historia', limit: 1 }),
    buscarCatalogo({ subject: 'Ciencias', limit: 1 }),
    buscarCatalogo({ subject: 'Filosofía', limit: 1 }),
    buscarCatalogo({ limit: 1 }),
  ]);

  const conteosPorMateria = [litRes.total, histRes.total, cienRes.total, filosRes.total];
  const totalRegistros = totalItems.total;

  return (
    <>
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] overflow-hidden bg-ink">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,239,224,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,239,224,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute bottom-0 right-0 h-96 w-96 -translate-x-1/4 translate-y-1/4 rounded-full bg-emerald-library/20 blur-[100px]" />
        <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-amber-book/10 blur-[80px]" />

        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
          <div className="animate-in mb-8 inline-flex items-center gap-3" style={{ '--delay': '0ms' } as React.CSSProperties}>
            <span className="h-px w-12 bg-amber-book" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-amber-book">
              Sistema de Gestión Bibliotecaria
            </span>
            <span className="h-px w-12 bg-amber-book" />
          </div>

          <h1 className="animate-in heading-xl mb-6 text-parchment" style={{ '--delay': '100ms' } as React.CSSProperties}>
            Descubre el{' '}
            <em className="italic text-amber-book">conocimiento</em>
            <br />
            que buscas
          </h1>

          <p className="animate-in mb-12 max-w-2xl text-lg leading-relaxed text-parchment/60" style={{ '--delay': '200ms' } as React.CSSProperties}>
            Accede al catálogo completo de tu biblioteca, gestiona tus préstamos
            y reserva espacios de estudio, todo desde un solo lugar.
          </p>

          <div className="animate-in w-full max-w-2xl" style={{ '--delay': '300ms' } as React.CSSProperties}>
            <SearchBar variant="hero" />
          </div>

          <div className="animate-in mt-16 flex flex-wrap items-center justify-center gap-12" style={{ '--delay': '400ms' } as React.CSSProperties}>
            {[
              { value: totalRegistros.toLocaleString('es-CO'), label: 'Títulos en catálogo' },
              { value: '65', label: 'Ejemplares disponibles' },
              { value: '12', label: 'Socios activos' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl font-semibold text-amber-book">{stat.value}</div>
                <div className="mt-1 font-body text-sm text-parchment/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-px bg-parchment/20" />
        </div>
      </section>

      {/* ─── Materias ─────────────────────────────────────────────────────────── */}
      <section className="bg-parchment py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <span className="section-label">Explorar por materia</span>
            <h2 className="heading-lg mt-2 text-ink">Materias más consultadas</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categorias.map((cat, i) => {
              const Icon = cat.icon;
              const count = conteosPorMateria[i] ?? 0;
              return (
                <Link
                  key={cat.name}
                  href={`/search?subject=${encodeURIComponent(cat.subject)}`}
                  className="group relative overflow-hidden rounded-sm border border-ink/10 bg-parchment-light p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-book/40 hover:shadow-md"
                >
                  <Icon className="mb-4 h-7 w-7 text-ink-muted transition-colors group-hover:text-amber-book" />
                  <div className="font-display text-lg font-semibold text-ink">{cat.name}</div>
                  <div className="mt-1 font-mono text-xs text-ink-muted">{count} título{count !== 1 ? 's' : ''}</div>
                  <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 text-amber-book" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Libros destacados ────────────────────────────────────────────────── */}
      <section className="border-t border-ink/8 bg-parchment-light py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <span className="section-label">Colección de la biblioteca</span>
              <h2 className="heading-lg mt-2 text-ink">Títulos disponibles</h2>
            </div>
            <Link href="/search" className="btn-secondary hidden md:inline-flex">
              Ver catálogo completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {destacados.data.slice(0, 8).map((libro, i) => {
              const autor = libro.authors[0]?.name ?? 'Autor desconocido';
              const materia = libro.subjects[0]?.term ?? libro.materialType;
              return (
                <Link
                  key={libro.id}
                  href={`/books/${libro.id}`}
                  className="card-hover group book-spine flex flex-col p-5"
                >
                  {/* Portada con imagen real de Open Library */}
                  <div className="mb-4 relative aspect-[3/4] overflow-hidden rounded-sm bg-parchment-dark">
                    {libro.coverImageUrl ? (
                      <Image
                        src={libro.coverImageUrl}
                        alt={`Portada de ${libro.title}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        onError={() => {}}
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: `hsl(${i * 45 + 30}, 20%, 80%)` }}
                      >
                        <BookOpen className="h-10 w-10 text-ink/30" />
                      </div>
                    )}
                  </div>

                  <span className="mb-1 font-mono text-xs text-ink-muted">{materia}</span>
                  <h3 className="font-display text-base font-semibold leading-snug text-ink group-hover:text-amber-book transition-colors line-clamp-2">
                    {libro.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted line-clamp-1">{autor}</p>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="font-mono text-xs text-ink-muted">{libro.publicationYear ?? '—'}</span>
                    <span className="rounded-full px-2 py-0.5 font-mono text-xs bg-emerald-pale text-emerald-library">
                      En catálogo
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Servicios ────────────────────────────────────────────────────────── */}
      <section className="bg-ink py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Clock,
                title: 'Préstamos y devoluciones',
                desc: 'Consulta el estado de tus préstamos activos, fechas de devolución y renuévalos en línea.',
              },
              {
                icon: MapPin,
                title: 'Reserva de espacios',
                desc: 'Reserva salas de estudio individual o colectivo con disponibilidad en tiempo real.',
              },
              {
                icon: BookMarked,
                title: 'Historial de lectura',
                desc: 'Accede a tu historial completo y sugerencias personalizadas según tus lecturas.',
              },
            ].map((svc) => {
              const Icon = svc.icon;
              return (
                <div key={svc.title} className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-amber-book/10">
                    <Icon className="h-5 w-5 text-amber-book" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-parchment">{svc.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-parchment/50">{svc.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="bg-parchment py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="divider-ornament mb-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
              ¿Todavía no eres socio?
            </span>
          </div>
          <h2 className="heading-md mb-6 text-ink">Únete a la comunidad de lectores</h2>
          <p className="mb-10 text-ink-muted">
            El registro es gratuito y te da acceso inmediato al catálogo completo,
            préstamos a domicilio y reserva de salas.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="btn-amber">
              Registrarme como socio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary">Ya tengo cuenta</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
