import { Clock, BookOpen, AlertTriangle, MapPin, RefreshCw, ChevronRight } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Link from 'next/link';

// ─── Mock patron data ────────────────────────────────────────────────────────
const mockLoans = [
  { id: '1', title: 'El nombre de la rosa', author: 'Umberto Eco', dueDate: '2026-04-15', barcode: 'BF-20240301-A1B2', status: 'active', daysLeft: 11 },
  { id: '2', title: 'Sapiens', author: 'Yuval Noah Harari', dueDate: '2026-04-05', barcode: 'BF-20240301-C3D4', status: 'overdue', daysLeft: -2 },
  { id: '3', title: 'Ficciones', author: 'Jorge Luis Borges', dueDate: '2026-04-20', barcode: 'BF-20240301-E5F6', status: 'active', daysLeft: 16 },
];

const mockFines = [
  { id: '1', amount: 1.00, reason: 'Devolución tardía – Sapiens', date: '2026-04-03' },
];

const mockReservations = [
  { id: '1', spaceName: 'Sala de estudio B3', date: '2026-04-05', time: '10:00–12:00', status: 'confirmed' },
];

export default function DashboardPage() {
  const overdueCount = mockLoans.filter((l) => l.status === 'overdue').length;
  const pendingFines = mockFines.reduce((s, f) => s + f.amount, 0);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-5xl px-6 py-10">

          {/* Header */}
          <div className="mb-10">
            <span className="section-label">Portal del socio</span>
            <h1 className="heading-md mt-2 text-ink">Mi cuenta</h1>
            <p className="mt-1 font-mono text-xs text-ink-muted">
              Carnet: <span className="text-amber-book">UCC-20260101-A1B2</span>
            </p>
          </div>

          {/* Alert banner for overdues */}
          {overdueCount > 0 && (
            <div className="mb-8 flex items-start gap-3 rounded-sm border border-rust/30 bg-rust/8 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rust" />
              <div>
                <p className="font-body text-sm font-medium text-rust">
                  Tienes {overdueCount} préstamo{overdueCount > 1 ? 's' : ''} vencido{overdueCount > 1 ? 's' : ''}
                </p>
                <p className="mt-0.5 font-body text-xs text-rust/70">
                  Devuelve los materiales para evitar multas adicionales.
                  Multa pendiente: <strong>€{pendingFines.toFixed(2)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Préstamos activos', value: mockLoans.filter(l => l.status === 'active').length, icon: BookOpen, color: 'text-emerald-library' },
              { label: 'Vencidos', value: overdueCount, icon: Clock, color: overdueCount > 0 ? 'text-rust' : 'text-ink-muted' },
              { label: 'Multas pendientes', value: `€${pendingFines.toFixed(2)}`, icon: AlertTriangle, color: pendingFines > 0 ? 'text-amber-book' : 'text-ink-muted' },
              { label: 'Reservas activas', value: mockReservations.length, icon: MapPin, color: 'text-ink-muted' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card p-5">
                  <Icon className={`mb-3 h-5 w-5 ${stat.color}`} />
                  <div className="font-display text-2xl font-semibold text-ink">{stat.value}</div>
                  <div className="mt-1 font-body text-xs text-ink-muted">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Active loans */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Préstamos activos</h2>
              <Link href="/dashboard/loans" className="font-mono text-xs text-amber-book hover:underline">
                Ver historial →
              </Link>
            </div>

            <div className="space-y-3">
              {mockLoans.map((loan) => (
                <div key={loan.id} className={`card flex items-center gap-4 p-4 ${loan.status === 'overdue' ? 'border-rust/20 bg-rust/3' : ''}`}>
                  <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-sm bg-parchment-dark">
                    <BookOpen className="h-5 w-5 text-ink/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-ink truncate">{loan.title}</p>
                    <p className="font-body text-xs text-ink-muted">{loan.author}</p>
                    <p className="font-mono text-xs text-ink-muted mt-0.5">Código: {loan.barcode}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-mono text-xs font-medium ${loan.status === 'overdue' ? 'text-rust' : 'text-ink-muted'}`}>
                      {loan.status === 'overdue' ? `Vencido hace ${Math.abs(loan.daysLeft)} días` : `Vence en ${loan.daysLeft} días`}
                    </p>
                    <p className="font-mono text-xs text-ink-muted mt-0.5">{loan.dueDate}</p>
                    <button className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-amber-book hover:underline">
                      <RefreshCw className="h-3 w-3" />
                      Renovar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming reservations */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Próximas reservas de sala</h2>
              <Link href="/spaces" className="font-mono text-xs text-amber-book hover:underline">
                Nueva reserva →
              </Link>
            </div>

            {mockReservations.length === 0 ? (
              <div className="card flex flex-col items-center py-10 text-center">
                <MapPin className="mb-3 h-8 w-8 text-ink/20" />
                <p className="font-body text-sm text-ink-muted">No tienes salas reservadas</p>
                <Link href="/spaces" className="btn-secondary mt-4 text-sm py-2 px-4">
                  Reservar una sala
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {mockReservations.map((res) => (
                  <div key={res.id} className="card flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-pale">
                      <MapPin className="h-5 w-5 text-emerald-library" />
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-sm font-medium text-ink">{res.spaceName}</p>
                      <p className="font-mono text-xs text-ink-muted">{res.date} · {res.time}</p>
                    </div>
                    <span className="rounded-full bg-emerald-pale px-2.5 py-1 font-mono text-xs text-emerald-library">
                      Confirmada
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
