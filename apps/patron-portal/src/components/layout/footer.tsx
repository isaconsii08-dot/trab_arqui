import Link from 'next/link';
import { BookOpen, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden" style={{ backgroundColor: '#3B1F14' }}>
      {/* Paper grain */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.06,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '256px 256px',
        }}
      />
      {/* Líneas de papel */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, rgba(237,207,196,0.05) 39px, rgba(237,207,196,0.05) 40px)',
        }}
      />
      {/* Borde rasgado superior */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{ height: '28px' }}>
        <svg viewBox="0 0 1440 28" preserveAspectRatio="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,0 L0,14 C80,20 120,8 200,14 C280,20 300,6 380,12 C460,18 480,4 560,10 C640,16 660,28 740,20 C820,12 840,4 920,10 C1000,16 1020,24 1100,18 C1180,12 1200,4 1280,10 C1360,16 1400,8 1440,14 L1440,0 Z"
            fill="#F5EFE0"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-14">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 inline-flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-sm"
                style={{ backgroundColor: 'rgba(237,207,196,0.15)' }}
              >
                <BookOpen className="h-3.5 w-3.5" style={{ color: '#E8A882' }} />
              </div>
              <span className="font-display text-base font-semibold" style={{ color: '#EDCFC4' }}>
                Biblio<span style={{ color: '#E8A882' }}>Flow</span>
              </span>
            </Link>
            <p className="mb-4 max-w-xs text-sm leading-relaxed" style={{ color: 'rgba(237,207,196,0.45)' }}>
              Sistema integral de gestión bibliotecaria de la Universidad Cooperativa
              de Colombia — Campus Montería.
            </p>
            <div className="space-y-1.5 font-mono text-xs" style={{ color: 'rgba(237,207,196,0.35)' }}>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 shrink-0" style={{ color: 'rgba(193,97,74,0.7)' }} />
                Cl. 52 #6-79, Montería, Córdoba
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 shrink-0" style={{ color: 'rgba(193,97,74,0.7)' }} />
                300 9137823
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 shrink-0" style={{ color: 'rgba(193,97,74,0.7)' }} />
                biblioteca.monteria@ucc.edu.co
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 shrink-0" style={{ color: 'rgba(193,97,74,0.7)' }} />
                Lun–Vie 7:00–22:00 · Sáb 8:00–16:00
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h4
              className="mb-4 font-mono text-xs uppercase tracking-[0.15em]"
              style={{ color: '#C1614A' }}
            >
              Servicios
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/search',    label: 'Catálogo' },
                { href: '/dashboard', label: 'Mis préstamos' },
                { href: '/spaces',    label: 'Reserva de salas' },
                { href: '/dashboard', label: 'Mi cuenta' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="footer-link text-sm">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* La biblioteca */}
          <div>
            <h4
              className="mb-4 font-mono text-xs uppercase tracking-[0.15em]"
              style={{ color: '#C1614A' }}
            >
              La biblioteca
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/about',          label: 'Sobre nosotros' },
                { href: '/about#horarios', label: 'Horarios' },
                { href: '/about#contacto', label: 'Contacto' },
                { href: '/register',       label: 'Hazte socio' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="footer-link text-sm">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row"
          style={{ borderColor: 'rgba(237,207,196,0.08)' }}
        >
          <p className="font-mono text-xs" style={{ color: 'rgba(237,207,196,0.25)' }}>
            © {new Date().getFullYear()} BiblioFlow · Universidad Cooperativa de Colombia · Campus Montería
          </p>
        </div>
      </div>
    </footer>
  );
}
