import Link from 'next/link';
import { BookOpen, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 inline-flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-amber-book/20">
                <BookOpen className="h-3.5 w-3.5 text-amber-book" />
              </div>
              <span className="font-display text-base font-semibold text-parchment">
                Biblio<span className="text-amber-book">Flow</span>
              </span>
            </Link>
            <p className="mb-4 max-w-xs text-sm leading-relaxed text-parchment/40">
              Sistema integral de gestión bibliotecaria de la Universidad Cooperativa
              de Colombia — Campus Montería.
            </p>
            <div className="space-y-1.5 font-mono text-xs text-parchment/35">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 shrink-0 text-amber-book/50" />
                Calle 21 #4-66, Montería, Córdoba
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 shrink-0 text-amber-book/50" />
                (604) 788 8888 ext. 5200
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 shrink-0 text-amber-book/50" />
                biblioteca.monteria@ucc.edu.co
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 shrink-0 text-amber-book/50" />
                Lun–Vie 7:00–22:00 · Sáb 8:00–16:00
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-amber-book">Servicios</h4>
            <ul className="space-y-2.5">
              <li><Link href="/search"    className="text-sm text-parchment/40 hover:text-parchment/80 transition-colors">Catálogo</Link></li>
              <li><Link href="/dashboard" className="text-sm text-parchment/40 hover:text-parchment/80 transition-colors">Mis préstamos</Link></li>
              <li><Link href="/spaces"    className="text-sm text-parchment/40 hover:text-parchment/80 transition-colors">Reserva de salas</Link></li>
              <li><Link href="/dashboard" className="text-sm text-parchment/40 hover:text-parchment/80 transition-colors">Mi cuenta</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-amber-book">La biblioteca</h4>
            <ul className="space-y-2.5">
              <li><Link href="/about"   className="text-sm text-parchment/40 hover:text-parchment/80 transition-colors">Sobre nosotros</Link></li>
              <li><Link href="/about#horarios" className="text-sm text-parchment/40 hover:text-parchment/80 transition-colors">Horarios</Link></li>
              <li><Link href="/about#contacto" className="text-sm text-parchment/40 hover:text-parchment/80 transition-colors">Contacto</Link></li>
              <li><Link href="/register" className="text-sm text-parchment/40 hover:text-parchment/80 transition-colors">Hazte socio</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-parchment/5 pt-8 md:flex-row">
          <p className="font-mono text-xs text-parchment/25">
            © {new Date().getFullYear()} BiblioFlow · Universidad Cooperativa de Colombia · Campus Montería
          </p>
          <p className="font-mono text-xs text-parchment/25">
            Desarrollado por <span className="text-amber-book/60">Isabella UCC</span> · v1.0.0
          </p>
        </div>
      </div>
    </footer>
  );
}
