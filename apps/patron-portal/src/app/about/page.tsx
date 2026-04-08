import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import Link from 'next/link';
import { BookOpen, MapPin, Phone, Mail, Clock, Users, Library, Award } from 'lucide-react';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'La biblioteca – BiblioFlow',
  description: 'Biblioteca Campus Montería, Universidad Cooperativa de Colombia.',
};

export default async function AboutPage() {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get('bf_token')?.value;
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">

        {/* Hero */}
        <section className="relative overflow-hidden py-24" style={{ backgroundColor: '#6B2A1A' }}>
          {/* Grain */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: 0.1,
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: '256px 256px',
            }}
          />
          {/* Líneas papel */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, rgba(237,207,196,0.08) 39px, rgba(237,207,196,0.08) 40px)',
            }}
          />
          {/* Blobs */}
          <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full opacity-30 blur-[100px]" style={{ backgroundColor: '#C1614A' }} />
          <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: '#8B3A27' }} />
          {/* Borde rasgado inferior */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: '32px' }}>
            <svg viewBox="0 0 1440 32" preserveAspectRatio="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,32 L0,16 C80,10 120,22 200,16 C280,10 320,4 400,12 C480,20 500,28 580,22 C660,16 680,6 760,14 C840,22 860,30 940,24 C1020,18 1040,8 1120,14 C1200,20 1240,26 1320,20 C1380,16 1420,10 1440,16 L1440,32 Z" fill="#F5EFE0" />
            </svg>
          </div>
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-sm" style={{ backgroundColor: 'rgba(237,207,196,0.15)' }}>
              <Library className="h-8 w-8" style={{ color: '#EDCFC4' }} />
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: 'rgba(237,207,196,0.6)' }}>
              Universidad Cooperativa de Colombia
            </span>
            <h1 className="mt-3 font-display text-4xl font-semibold" style={{ color: '#EDCFC4' }}>
              Biblioteca Campus Montería
            </h1>
            <p className="mt-4 font-body text-lg leading-relaxed" style={{ color: 'rgba(237,207,196,0.55)' }}>
              Un espacio de conocimiento al servicio de la comunidad universitaria
              del Campus Montería.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-16 space-y-16">

          {/* Misión y visión */}
          <section>
            <span className="section-label">Quiénes somos</span>
            <h2 className="heading-md mt-2 mb-8 text-ink">Nuestra misión</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-amber-book/10">
                  <BookOpen className="h-5 w-5 text-amber-book" />
                </div>
                <h3 className="mb-2 font-display text-base font-semibold text-ink">Misión</h3>
                <p className="font-body text-sm leading-relaxed text-ink-muted">
                  Proporcionar acceso equitativo a la información y al conocimiento, apoyando
                  los procesos académicos e investigativos de la comunidad universitaria mediante
                  servicios bibliotecarios de calidad, recursos actualizados y espacios propicios
                  para el aprendizaje.
                </p>
              </div>
              <div className="card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-library/10">
                  <Award className="h-5 w-5 text-emerald-library" />
                </div>
                <h3 className="mb-2 font-display text-base font-semibold text-ink">Visión</h3>
                <p className="font-body text-sm leading-relaxed text-ink-muted">
                  Ser una biblioteca universitaria de referencia en la región Caribe, reconocida
                  por la excelencia en sus servicios, la modernización continua de sus recursos
                  y su contribución al desarrollo académico y cultural de la comunidad educativa.
                </p>
              </div>
            </div>
          </section>

          {/* Estadísticas */}
          <section>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { value: '+20.000', label: 'Títulos en colección', icon: BookOpen },
                { value: '+65.000', label: 'Volúmenes físicos',    icon: Library  },
                { value: '6',       label: 'Salas de estudio',     icon: Users    },
                { value: 'REDBIUN', label: 'Red interbibliotecaria', icon: Award  },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="card p-5 text-center">
                    <Icon className="mx-auto mb-2 h-5 w-5 text-amber-book" />
                    <div className="font-display text-2xl font-semibold text-ink">{s.value}</div>
                    <div className="mt-1 font-mono text-xs text-ink-muted">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Servicios */}
          <section>
            <span className="section-label">Lo que ofrecemos</span>
            <h2 className="heading-md mt-2 mb-8 text-ink">Servicios</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: 'Préstamo de materiales',
                  desc: 'Préstamo domiciliario de libros, revistas y recursos multimedia para socios activos. Hasta 3 materiales simultáneos con opción de renovación en línea.',
                },
                {
                  title: 'Acceso a bases de datos',
                  desc: 'Acceso a bases de datos académicas: ProQuest, SciELO, JSTOR, Redalyc y portales especializados por programa académico.',
                },
                {
                  title: 'Salas de estudio',
                  desc: 'Seis espacios de estudio individual y grupal con WiFi, proyector y climatización. Reserva en línea desde el portal del socio.',
                },
                {
                  title: 'Referencia y consulta',
                  desc: 'Asesoría personalizada para búsqueda de información, normas APA/Vancouver, citación de fuentes y trabajos de grado.',
                },
                {
                  title: 'Recursos digitales',
                  desc: 'Acceso al catálogo digital, libros electrónicos y recursos de aprendizaje disponibles 24/7 desde cualquier dispositivo.',
                },
                {
                  title: 'Préstamo interbibliotecario',
                  desc: 'Servicio de préstamo entre sedes de la UCC a nivel nacional mediante la red REDBIUN.',
                },
              ].map((s) => (
                <div key={s.title} className="card p-5">
                  <h3 className="mb-2 font-display text-sm font-semibold text-ink">{s.title}</h3>
                  <p className="font-body text-xs leading-relaxed text-ink-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Horarios */}
          <section id="horarios">
            <span className="section-label">Planifica tu visita</span>
            <h2 className="heading-md mt-2 mb-8 text-ink">Horarios de atención</h2>
            <div className="card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-ink/8 px-5 py-4">
                <Clock className="h-5 w-5 text-amber-book" />
                <span className="font-display text-sm font-semibold text-ink">Semestre académico</span>
              </div>
              <div className="divide-y divide-ink/5">
                {[
                  { dia: 'Lunes – Viernes',      hora: '7:00 a.m. – 10:00 p.m.' },
                  { dia: 'Sábados',               hora: '8:00 a.m. – 4:00 p.m.'  },
                  { dia: 'Domingos y festivos',   hora: 'Cerrado'                 },
                ].map((h) => (
                  <div key={h.dia} className="flex items-center justify-between px-5 py-3">
                    <span className="font-body text-sm text-ink">{h.dia}</span>
                    <span className={`font-mono text-xs ${h.hora === 'Cerrado' ? 'text-rust' : 'text-emerald-library'}`}>
                      {h.hora}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-ink/8 bg-parchment-dark px-5 py-3">
                <p className="font-mono text-xs text-ink-muted">
                  * En períodos de receso académico el horario puede variar. Consulta el portal institucional.
                </p>
              </div>
            </div>
          </section>

          {/* Contacto */}
          <section id="contacto">
            <span className="section-label">Estamos aquí para ayudarte</span>
            <h2 className="heading-md mt-2 mb-8 text-ink">Contacto</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="card p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-book" />
                  <div>
                    <p className="font-body text-sm font-medium text-ink">Dirección</p>
                    <p className="font-mono text-xs text-ink-muted">
                      Cl. 52 #6-79, Montería, Córdoba<br />
                      Universidad Cooperativa de Colombia
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-book" />
                  <div>
                    <p className="font-body text-sm font-medium text-ink">Teléfono</p>
                    <p className="font-mono text-xs text-ink-muted">300 9137823</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-book" />
                  <div>
                    <p className="font-body text-sm font-medium text-ink">Correo</p>
                    <p className="font-mono text-xs text-ink-muted">biblioteca.monteria@ucc.edu.co</p>
                  </div>
                </div>
              </div>
              {!isLoggedIn && (
                <div className="card flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <BookOpen className="h-10 w-10 text-ink/20" />
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">¿Primera vez en la biblioteca?</p>
                    <p className="mt-1 font-body text-xs text-ink-muted">
                      Regístrate como socio para acceder a todos los servicios de préstamo y reserva en línea.
                    </p>
                  </div>
                  <Link href="/register" className="btn-amber text-sm px-5 py-2">
                    Registrarme gratis
                  </Link>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
      <Footer />
    </>
  );
}
