import Link from 'next/link';
import { cookies } from 'next/headers';
import { BookOpen, Clock, MapPin, ArrowRight, Library, BookMarked, Star } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import SearchBar from '@/components/search/search-bar';
import BookCover from '@/components/ui/book-cover';
import { buscarCatalogo } from '@/lib/api';

const categorias = [
  { name: 'Literatura', subject: 'Literatura', count: null, icon: BookOpen },
  { name: 'Historia', subject: 'Historia', count: null, icon: BookMarked },
  { name: 'Ciencias', subject: 'Ciencias', count: null, icon: Star },
  { name: 'Filosofía', subject: 'Filosofía', count: null, icon: Library },
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get('bf_token')?.value;
  let firstName = '';
  try {
    const raw = cookieStore.get('bf_user')?.value;
    if (raw) {
      const user = JSON.parse(decodeURIComponent(raw)) as { fullName?: string };
      firstName = user.fullName?.split(' ')[0] ?? '';
    }
  } catch { /* ignorar */ }

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
      <section className="relative min-h-[92vh] overflow-hidden" style={{ backgroundColor: '#EDD9BE' }}>
        {/* Paper grain noise — más intenso que el global */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            opacity: 0.07,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: '256px 256px',
          }}
        />

        {/* Blobs suaves terracota/ámbar */}
        <div className="absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full opacity-25 blur-[120px]" style={{ backgroundColor: '#C1614A' }} />
        <div className="absolute right-0 top-0 h-80 w-80 translate-x-1/3 -translate-y-1/4 rounded-full opacity-20 blur-[100px]" style={{ backgroundColor: '#C8860A' }} />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full opacity-15 blur-[90px]" style={{ backgroundColor: '#8B3A27' }} />

        {/* Líneas de papel horizontales sutiles */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, rgba(139,58,39,0.06) 39px, rgba(139,58,39,0.06) 40px)',
            backgroundSize: '100% 40px',
          }}
        />

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
          <div className="animate-in mb-8 inline-flex items-center gap-3" style={{ '--delay': '0ms' } as React.CSSProperties}>
            <span className="h-px w-12" style={{ backgroundColor: '#C1614A' }} />
            <span className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: '#8B3A27' }}>
              Sistema de Gestión Bibliotecaria
            </span>
            <span className="h-px w-12" style={{ backgroundColor: '#C1614A' }} />
          </div>

          <h1
            className="animate-in heading-xl mb-6"
            style={{ '--delay': '100ms', color: '#3B1F14' } as React.CSSProperties}
          >
            Descubre el{' '}
            <em className="italic" style={{ color: '#C1614A' }}>conocimiento</em>
            <br />
            que buscas
          </h1>

          <p
            className="animate-in mb-12 max-w-2xl text-lg leading-relaxed"
            style={{ '--delay': '200ms', color: 'rgba(59,31,20,0.6)' } as React.CSSProperties}
          >
            Accede al catálogo completo de tu biblioteca, gestiona tus préstamos
            y reserva espacios de estudio, todo desde un solo lugar.
          </p>

          <div className="animate-in w-full max-w-2xl" style={{ '--delay': '300ms' } as React.CSSProperties}>
            <SearchBar variant="hero" />
          </div>

          <div
            className="animate-in mt-16 flex flex-wrap items-center justify-center gap-12"
            style={{ '--delay': '400ms' } as React.CSSProperties}
          >
            {[
              { value: totalRegistros.toLocaleString('es-CO'), label: 'Títulos en catálogo' },
              { value: '65', label: 'Ejemplares disponibles' },
              { value: '12', label: 'Socios activos' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl font-semibold" style={{ color: '#C1614A' }}>{stat.value}</div>
                <div className="mt-1 font-body text-sm" style={{ color: 'rgba(59,31,20,0.5)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Borde inferior rasgado — transición hacia parchment */}
        <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden" style={{ height: '60px' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,60 L0,28 C60,22 80,38 140,30 C200,22 220,10 280,18 C340,26 360,38 420,32 C480,26 500,12 560,20 C620,28 640,42 700,36 C760,30 780,16 840,22 C900,28 920,44 980,38 C1040,32 1060,18 1120,24 C1180,30 1200,46 1260,40 C1320,34 1360,20 1440,28 L1440,60 Z"
              fill="#F5EFE0"
            />
          </svg>
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
                  {/* Portada */}
                  <div className="mb-4 relative aspect-[3/4] overflow-hidden rounded-sm bg-parchment-dark">
                    <BookCover
                      src={libro.coverImageUrl}
                      title={libro.title}
                      author={libro.authors[0]?.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      colorIndex={i}
                    />
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
      <section className="relative overflow-hidden py-16" style={{ backgroundColor: '#2A1208' }}>
        {/* Grain */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 0.07,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: '256px 256px',
          }}
        />
        {/* Líneas de papel */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, rgba(193,97,74,0.04) 39px, rgba(193,97,74,0.04) 40px)',
          }}
        />
        {/* Blob terracota tenue */}
        <div
          className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full blur-[100px]"
          style={{ backgroundColor: '#C1614A', opacity: 0.12 }}
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: '#C1614A' }}>
              ¿Qué puedes hacer?
            </span>
            <h2 className="font-display mt-2 text-2xl font-semibold md:text-3xl" style={{ color: '#EDCFC4' }}>
              Todo desde un solo lugar
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Clock,
                title: 'Préstamos y devoluciones',
                desc: 'Consulta el estado de tus préstamos activos, fechas de devolución y renuévalos en línea.',
                href: '/dashboard',
              },
              {
                icon: MapPin,
                title: 'Reserva de espacios',
                desc: 'Reserva salas de estudio individual o grupal con disponibilidad en tiempo real.',
                href: '/spaces',
              },
              {
                icon: BookMarked,
                title: 'Historial de lectura',
                desc: 'Accede a tu historial completo de préstamos y explora el catálogo completo.',
                href: '/dashboard/historial',
              },
            ].map((svc) => {
              const Icon = svc.icon;
              return (
                <Link
                  key={svc.title}
                  href={svc.href}
                  className="service-card group flex gap-4 rounded-sm p-5"
                >
                  <div
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
                    style={{ backgroundColor: 'rgba(193,97,74,0.15)' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: '#C1614A' }} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold" style={{ color: '#EDCFC4' }}>{svc.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'rgba(237,207,196,0.5)' }}>{svc.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────────── */}
      {isLoggedIn ? (
        <section className="bg-parchment py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="divider-ornament mb-8">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
                Portal del socio
              </span>
            </div>
            <h2 className="heading-md mb-4 text-ink">
              Bienvenido{firstName ? `, ${firstName}` : ''} 👋
            </h2>
            <p className="mb-3 font-display text-xl italic text-terracotta">
              Tu próxima gran lectura te espera.
            </p>
            <p className="mb-10 text-ink-muted">
              Revisa tus préstamos activos, explora nuevos títulos en el catálogo
              o reserva tu espacio favorito.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/search" className="btn-amber">
                Explorar catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                Ver mis préstamos
              </Link>
            </div>
          </div>
        </section>
      ) : (
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
      )}

      <Footer />
    </>
  );
}
