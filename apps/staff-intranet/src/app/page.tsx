import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Users,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
} from 'lucide-react';

// ─── Mock dashboard data ─────────────────────────────────────────────────────
const stats = [
  { label: 'Préstamos hoy', value: 47, delta: +12, icon: BookOpen, color: 'text-accent-green', trend: 'up' },
  { label: 'Devoluciones hoy', value: 38, delta: -3, icon: RefreshCw, color: 'text-accent-blue', trend: 'down' },
  { label: 'Socios activos', value: 1_284, delta: +5, icon: Users, color: 'text-accent-purple', trend: 'up' },
  { label: 'Préstamos vencidos', value: 23, delta: +8, icon: AlertTriangle, color: 'text-accent-amber', trend: 'up' },
];

const recentLoans = [
  { id: 'L-0248', patron: 'Ana García', barcode: 'BF-001-A3B4', title: 'Cien años de soledad', time: '09:14', status: 'active' },
  { id: 'L-0247', patron: 'Carlos Ruiz', barcode: 'BF-002-C5D6', title: 'El Quijote (Vol. 1)', time: '08:58', status: 'active' },
  { id: 'L-0246', patron: 'María López', barcode: 'BF-003-E7F8', title: 'Sapiens', time: '08:33', status: 'returned' },
  { id: 'L-0245', patron: 'Jorge Martín', barcode: 'BF-004-G9H0', title: 'Ficciones', time: '08:10', status: 'active' },
  { id: 'L-0244', patron: 'Laura Sánchez', barcode: 'BF-005-I1J2', title: 'La Odisea', time: '07:55', status: 'overdue' },
];

const topTitles = [
  { rank: 1, title: 'Sapiens', loans: 28 },
  { rank: 2, title: 'Cien años de soledad', loans: 24 },
  { rank: 3, title: 'El nombre de la rosa', loans: 19 },
  { rank: 4, title: 'Ficciones', loans: 17 },
  { rank: 5, title: 'La casa de los espíritus', loans: 14 },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Dashboard operacional</h1>
        <p className="mt-0.5 font-mono text-xs capitalize text-text-muted">{today}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          const isPositive = (stat.label === 'Préstamos vencidos') ? stat.trend === 'down' : stat.trend === 'up';

          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-start justify-between">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <div className={`flex items-center gap-1 ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                  <TrendIcon className="h-3 w-3" />
                  <span className="font-mono text-xs">{Math.abs(stat.delta)}</span>
                </div>
              </div>
              <div className="mt-3 font-display text-2xl font-semibold text-text-primary">
                {stat.value.toLocaleString()}
              </div>
              <div className="mt-1 font-body text-xs text-text-muted">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent loans table */}
        <div className="lg:col-span-2 surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold text-text-primary">Actividad reciente</h2>
            <a href="/circulation" className="font-mono text-xs text-accent-green hover:underline">
              Ver todo →
            </a>
          </div>

          <table className="data-table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Socio</th>
                <th>Título</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentLoans.map((loan) => (
                <tr key={loan.id} className="table-row">
                  <td className="font-mono text-xs text-text-muted">{loan.id}</td>
                  <td className="font-medium">{loan.patron}</td>
                  <td className="max-w-[160px] truncate text-text-secondary">{loan.title}</td>
                  <td className="font-mono text-xs text-text-muted">{loan.time}</td>
                  <td>
                    {loan.status === 'active' && (
                      <span className="badge badge-green">
                        <CheckCircle className="mr-1 h-2.5 w-2.5" />
                        Activo
                      </span>
                    )}
                    {loan.status === 'returned' && (
                      <span className="badge badge-blue">Devuelto</span>
                    )}
                    {loan.status === 'overdue' && (
                      <span className="badge badge-red">
                        <Clock className="mr-1 h-2.5 w-2.5" />
                        Vencido
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top borrowed titles */}
        <div className="surface-card overflow-hidden">
          <div className="border-b border-surface-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold text-text-primary">Más prestados</h2>
            <p className="font-mono text-xs text-text-muted">Este mes</p>
          </div>
          <ul className="divide-y divide-surface-border">
            {topTitles.map((item) => (
              <li key={item.rank} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised/50 transition-colors">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-surface-raised font-mono text-xs text-text-muted">
                  {item.rank}
                </span>
                <span className="flex-1 truncate font-body text-sm text-text-primary">{item.title}</span>
                <span className="font-mono text-xs text-accent-green">{item.loans}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick actions */}
      <div className="surface-card p-4">
        <h2 className="mb-3 font-display text-sm font-semibold text-text-primary">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/circulation?action=loan" className="btn-green text-sm">
            <BookOpen className="h-4 w-4" />
            Nuevo préstamo
          </a>
          <a href="/circulation?action=return" className="btn-ghost text-sm">
            <RefreshCw className="h-4 w-4" />
            Registrar devolución
          </a>
          <a href="/patrons/new" className="btn-ghost text-sm">
            <Users className="h-4 w-4" />
            Nuevo socio
          </a>
          <a href="/catalog/new" className="btn-ghost text-sm">
            <BookOpen className="h-4 w-4" />
            Añadir material
          </a>
        </div>
      </div>
    </div>
  );
}
