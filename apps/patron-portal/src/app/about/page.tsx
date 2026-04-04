import { BookOpen, Clock, MapPin, Phone, Mail } from 'lucide-react';
import Navbar from '@/components/layout/navbar';

export const metadata = {
  title: 'La biblioteca — BiblioFlow',
  description: 'Conoce los servicios, horarios y recursos de la Biblioteca UCC.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        {/* Hero */}
        <div className="border-b border-ink/8 bg-parchment-light py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <span className="section-label">Biblioteca UCC</span>
            <h1 className="heading-xl mt-3 text-ink">Tu espacio de conocimiento</h1>
            <p className="mt-4 font-body text-base text-ink-muted max-w-2xl mx-auto">
              La Biblioteca UCC pone a disposición de la comunidad universitaria más de 1.200 títulos,
              salas de estudio, recursos digitales y un servicio de préstamo en línea.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-6 py-12 space-y-12">
          {/* Servicios */}
          <section>
            <h2 className="font-display text-xl font-semibold text-ink mb-6">Servicios</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { titulo: 'Préstamo de libros', desc: 'Hasta 3 libros simultáneos por un período de 14 días, renovables en línea.' },
                { titulo: 'Sala de lectura', desc: 'Espacios silenciosos para lectura e investigación individual.' },
                { titulo: 'Salas de grupos', desc: 'Reserva salas equipadas con proyector y pizarrón para trabajo en equipo.' },
                { titulo: 'Bases de datos', desc: 'Acceso a JSTOR, ScienceDirect, EBSCOhost y otras plataformas académicas.' },
                { titulo: 'Hemeroteca', desc: 'Colección de revistas científicas y publicaciones periódicas nacionales e internacionales.' },
                { titulo: 'Préstamo interbibliotecario', desc: 'Solicitud de materiales de otras bibliotecas de la red UCC.' },
              ].map((s) => (
                <div key={s.titulo} className="card p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-book" />
                    <h3 className="font-display text-sm font-semibold text-ink">{s.titulo}</h3>
                  </div>
                  <p className="font-body text-sm text-ink-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Horarios */}
          <section>
            <h2 className="font-display text-xl font-semibold text-ink mb-6">Horarios de atención</h2>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink/8 bg-parchment-light">
                    <th className="px-5 py-3 text-left font-display text-sm font-semibold text-ink">Día</th>
                    <th className="px-5 py-3 text-left font-mono text-xs font-medium text-ink-muted">Apertura</th>
                    <th className="px-5 py-3 text-left font-mono text-xs font-medium text-ink-muted">Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/6">
                  {[
                    { dia: 'Lunes – Viernes', apertura: '07:00', cierre: '22:00' },
                    { dia: 'Sábado',          apertura: '08:00', cierre: '16:00' },
                    { dia: 'Domingo',         apertura: 'Cerrado', cierre: '' },
                  ].map((h) => (
                    <tr key={h.dia}>
                      <td className="px-5 py-3 font-body text-sm text-ink">{h.dia}</td>
                      <td className="px-5 py-3 font-mono text-sm text-ink-muted">{h.apertura}</td>
                      <td className="px-5 py-3 font-mono text-sm text-ink-muted">{h.cierre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="font-display text-xl font-semibold text-ink mb-6">Contacto</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card flex items-start gap-3 p-5">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-book" />
                <div>
                  <p className="font-body text-sm font-medium text-ink">Ubicación</p>
                  <p className="font-body text-sm text-ink-muted">Edificio A, piso 2<br />Campus UCC, Bogotá</p>
                </div>
              </div>
              <div className="card flex items-start gap-3 p-5">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-amber-book" />
                <div>
                  <p className="font-body text-sm font-medium text-ink">Teléfono</p>
                  <p className="font-body text-sm text-ink-muted">+57 (601) 327 8888<br />Ext. 1200</p>
                </div>
              </div>
              <div className="card flex items-start gap-3 p-5">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-book" />
                <div>
                  <p className="font-body text-sm font-medium text-ink">Email</p>
                  <p className="font-body text-sm text-ink-muted">biblioteca@ucc.edu.co</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
