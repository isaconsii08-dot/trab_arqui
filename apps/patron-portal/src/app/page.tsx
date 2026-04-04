import Link from 'next/link';
import { Search, BookOpen, Clock, MapPin, ArrowRight, Library, BookMarked, Star } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import SearchBar from '@/components/search/search-bar';

// ─── Mock featured data ──────────────────────────────────────────────────────
const featuredBooks = [
  { id: '1', title: 'Cien años de soledad', author: 'Gabriel García Márquez', year: 1967, available: true, subject: 'Realismo mágico' },
  { id: '2', title: 'El nombre de la rosa', author: 'Umberto Eco', year: 1980, available: false, subject: 'Novela histórica' },
  { id: '3', title: 'Sapiens', author: 'Yuval Noah Harari', year: 2011, available: true, subject: 'Historia' },
  { id: '4', title: 'La casa de los espíritus', author: 'Isabel Allende', year: 1982, available: true, subject: 'Literatura latinoamericana' },
];

const categories = [
  { name: 'Literatura', count: 2847, icon: BookOpen, color: 'emerald' },
  { name: 'Historia', count: 1204, icon: BookMarked, color: 'amber' },
  { name: 'Ciencias', count: 956, icon: Star, color: 'rust' },
  { name: 'Filosofía', count: 634, icon: Library, color: 'ink' },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] overflow-hidden bg-ink">
        {/* Decorative grid lines */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,239,224,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,239,224,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Gradient accent – bottom right emerald glow */}
        <div className="absolute bottom-0 right-0 h-96 w-96 -translate-x-1/4 translate-y-1/4 rounded-full bg-emerald-library/20 blur-[100px]" />
        <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-amber-book/10 blur-[80px]" />

        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
          {/* Overline label */}
          <div className="animate-in mb-8 inline-flex items-center gap-3" style={{ '--delay': '0ms' } as React.CSSProperties}>
            <span className="h-px w-12 bg-amber-book" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-amber-book">
              Sistema de Gestión Bibliotecaria
            </span>
            <span className="h-px w-12 bg-amber-book" />
          </div>

          {/* Main heading */}
          <h1
            className="animate-in heading-xl mb-6 text-parchment"
            style={{ '--delay': '100ms' } as React.CSSProperties}
          >
            Descubre el{' '}
            <em className="italic text-amber-book">conocimiento</em>
            <br />
            que buscas
          </h1>

          <p
            className="animate-in mb-12 max-w-2xl text-lg leading-relaxed text-parchment/60"
            style={{ '--delay': '200ms' } as React.CSSProperties}
          >
            Accede al catálogo completo de tu biblioteca, gestiona tus préstamos
            y reserva espacios de estudio, todo desde un solo lugar.
          </p>

          {/* Search bar */}
          <div
            className="animate-in w-full max-w-2xl"
            style={{ '--delay': '300ms' } as React.CSSProperties}
          >
            <SearchBar variant="hero" />
          </div>

          {/* Quick stats */}
          <div
            className="animate-in mt-16 flex flex-wrap items-center justify-center gap-12"
            style={{ '--delay': '400ms' } as React.CSSProperties}
          >
            {[
              { value: '12,847', label: 'Títulos en catálogo' },
              { value: '3,204', label: 'Ejemplares disponibles' },
              { value: '24', label: 'Salas de estudio' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl font-semibold text-amber-book">{stat.value}</div>
                <div className="mt-1 font-body text-sm text-parchment/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-px bg-parchment/20" />
        </div>
      </section>

      {/* ─── Search by Category ───────────────────────────────────────────── */}
      <section className="bg-parchment py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <span className="section-label">Explorar por materia</span>
            <h2 className="heading-lg mt-2 text-ink">Materias más consultadas</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  href={`/search?subject=${encodeURIComponent(cat.name)}`}
                  className="group relative overflow-hidden rounded-sm border border-ink/10 bg-parchment-light p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-book/40 hover:shadow-md"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <Icon className="mb-4 h-7 w-7 text-ink-muted transition-colors group-hover:text-amber-book" />
                  <div className="font-display text-lg font-semibold text-ink">{cat.name}</div>
                  <div className="mt-1 font-mono text-xs text-ink-muted">{cat.count.toLocaleString()} títulos</div>
                  <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 text-amber-book" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Featured Books ───────────────────────────────────────────────── */}
      <section className="border-t border-ink/8 bg-parchment-light py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <span className="section-label">Selección del bibliotecario</span>
              <h2 className="heading-lg mt-2 text-ink">Novedades destacadas</h2>
            </div>
            <Link href="/search" className="btn-secondary hidden md:inline-flex">
              Ver catálogo completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featuredBooks.map((book, i) => (
              <Link
                key={book.id}
                href={`/catalog/${book.id}`}
                className="card-hover group book-spine flex flex-col p-5"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Cover placeholder with color variety */}
                <div
                  className="mb-4 flex aspect-[3/4] items-center justify-center rounded-sm"
                  style={{
                    background: `hsl(${i * 60 + 30}, 25%, ${i % 2 === 0 ? 82 : 75}%)`,
                  }}
                >
                  <BookOpen className="h-10 w-10 text-ink/30" />
                </div>

                <span className="mb-1 font-mono text-xs text-ink-muted">{book.subject}</span>
                <h3 className="font-display text-base font-semibold leading-snug text-ink group-hover:text-amber-book transition-colors">
                  {book.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">{book.author}</p>

                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-muted">{book.year}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-xs ${
                      book.available
                        ? 'bg-emerald-pale text-emerald-library'
                        : 'bg-rust/10 text-rust'
                    }`}
                  >
                    {book.available ? 'Disponible' : 'Prestado'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services strip ──────────────────────────────────────────────── */}
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
                desc: 'Accede a tu historial completo, lista de deseos y sugerencias personalizadas.',
              },
            ].map((service, i) => {
              const Icon = service.icon;
              return (
                <div key={service.title} className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-amber-book/10">
                    <Icon className="h-5 w-5 text-amber-book" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-parchment">{service.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-parchment/50">{service.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-parchment py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="divider-ornament mb-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
              ¿Todavía no eres socio?
            </span>
          </div>
          <h2 className="heading-md mb-6 text-ink">
            Únete a la comunidad de lectores
          </h2>
          <p className="mb-10 text-ink-muted">
            El registro es gratuito y te da acceso inmediato al catálogo completo,
            préstamos a domicilio y reserva de salas.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="btn-amber">
              Registrarme como socio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
