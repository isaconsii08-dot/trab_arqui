import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-amber-book/20">
                <BookOpen className="h-3.5 w-3.5 text-amber-book" />
              </div>
              <span className="font-display text-base font-semibold text-parchment">
                Biblio<span className="text-amber-book">Flow</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-parchment/40 max-w-xs">
              Sistema integral de gestión bibliotecaria. Diseñado para conectar lectores
              con el conocimiento de forma eficiente y elegante.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-amber-book">Servicios</h4>
            <ul className="space-y-2.5">
              {['Catálogo', 'Préstamos', 'Reservas de sala', 'Mi cuenta'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-parchment/40 hover:text-parchment/70 cursor-pointer transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-amber-book">Información</h4>
            <ul className="space-y-2.5">
              {['Sobre nosotros', 'Horarios', 'Contacto', 'Política de privacidad'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-parchment/40 hover:text-parchment/70 cursor-pointer transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-parchment/5 pt-8 md:flex-row">
          <p className="font-mono text-xs text-parchment/25">
            © {new Date().getFullYear()} BiblioFlow. Desarrollado por{' '}
            <span className="text-amber-book/60">Isabella UCC</span>
          </p>
          <p className="font-mono text-xs text-parchment/25">
            v1.0.0 — Trabajo de grado universitario
          </p>
        </div>
      </div>
    </footer>
  );
}
