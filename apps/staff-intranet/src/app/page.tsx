import {
  BookOpen,
  Users,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { obtenerEstadisticas, obtenerPrestamosVencidos, listarCatalogo } from '@/lib/api';

interface LoanDto {
  id: string;
  itemId: string;
  patronId: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  renewedCount: number;
  fineAmount: number;
  itemBarcode: string;
  itemTitle: string;
}

interface CatalogRecord {
  id: string;
  title: string;
  authors?: Array<{ name: string }>;
}

export default async function DashboardPage() {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Obtener datos reales en paralelo
  const [estadisticas, prestamosVencidos, catalogData] = await Promise.all([
    obtenerEstadisticas().catch(() => ({
      socios: { total: 0, activos: 0, suspendidos: 0, expirados: 0 },
      circulacion: { prestamosVencidos: 0 },
      catalogTotal: 0,
    })),
    obtenerPrestamosVencidos().catch(() => [] as LoanDto[]),
    listarCatalogo({ limit: 5, page: 1 }).catch(() => ({ data: [] as CatalogRecord[], total: 0 })),
  ]);

  const loans = prestamosVencidos as LoanDto[];
  const topTitulos = (catalogData.data as CatalogRecord[]).slice(0, 5);

  const stats = [
    {
      label: 'Socios activos',
      value: estadisticas.socios.activos,
      total: estadisticas.socios.total,
      icon: Users,
      color: 'text-accent-purple',
    },
    {
      label: 'Catálogo total',
      value: estadisticas.catalogTotal,
      total: null,
      icon: BookOpen,
      color: 'text-accent-blue',
    },
    {
      label: 'Vencidos',
      value: estadisticas.circulacion.prestamosVencidos,
      total: null,
      icon: AlertTriangle,
      color: estadisticas.circulacion.prestamosVencidos > 0 ? 'text-accent-amber' : 'text-text-muted',
    },
    {
      label: 'Suspendidos',
      value: estadisticas.socios.suspendidos,
      total: null,
      icon: RefreshCw,
      color: estadisticas.socios.suspendidos > 0 ? 'text-accent-red' : 'text-text-muted',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Dashboard operacional</h1>
        <p className="mt-0.5 font-mono text-xs capitalize text-text-muted">{today}</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-start justify-between">
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="mt-3 font-display text-2xl font-semibold text-text-primary">
                {stat.value.toLocaleString()}
              </div>
              <div className="mt-1 font-body text-xs text-text-muted">{stat.label}</div>
              {stat.total !== null && (
                <div className="mt-0.5 font-mono text-xs text-text-muted">
                  de {stat.total.toLocaleString()} registrados
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tabla de préstamos vencidos */}
        <div className="lg:col-span-2 surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold text-text-primary">Préstamos vencidos</h2>
            <a href="/circulation" className="font-mono text-xs text-accent-green hover:underline">
              Ver circulación →
            </a>
          </div>

          {loans.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle className="mb-2 h-8 w-8 text-accent-green/40" />
              <p className="font-mono text-xs text-text-muted">Sin préstamos vencidos</p>
            </div>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título / Ejemplar</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loans.slice(0, 8).map((loan) => (
                  <tr key={loan.id} className="table-row">
                    <td className="font-mono text-xs text-text-muted">
                      {(loan.itemBarcode || loan.itemId).slice(0, 14)}
                    </td>
                    <td className="max-w-[180px] truncate">
                      {loan.itemTitle || loan.itemBarcode || loan.itemId}
                    </td>
                    <td className="font-mono text-xs text-text-muted">
                      {new Date(loan.dueDate).toLocaleDateString('es-CO')}
                    </td>
                    <td>
                      {loan.status === 'overdue' && (
                        <span className="badge badge-red">
                          <Clock className="mr-1 h-2.5 w-2.5" />
                          Vencido
                        </span>
                      )}
                      {loan.status === 'active' && (
                        <span className="badge badge-green">
                          <CheckCircle className="mr-1 h-2.5 w-2.5" />
                          Activo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Títulos recientes del catálogo */}
        <div className="surface-card overflow-hidden">
          <div className="border-b border-surface-border px-4 py-3">
            <h2 className="font-display text-sm font-semibold text-text-primary">Catálogo</h2>
            <p className="font-mono text-xs text-text-muted">
              {estadisticas.catalogTotal} materiales registrados
            </p>
          </div>
          <ul className="divide-y divide-surface-border">
            {topTitulos.map((item, i) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised/50 transition-colors">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-surface-raised font-mono text-xs text-text-muted">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-body text-sm text-text-primary">{item.title}</p>
                  {item.authors?.[0] && (
                    <p className="truncate font-mono text-xs text-text-muted">{item.authors[0].name}</p>
                  )}
                </div>
              </li>
            ))}
            {topTitulos.length === 0 && (
              <li className="px-4 py-6 text-center font-mono text-xs text-text-muted">
                Cargando catálogo...
              </li>
            )}
          </ul>
          <div className="border-t border-surface-border px-4 py-3">
            <a href="/catalog" className="font-mono text-xs text-accent-green hover:underline">
              Ver todo el catálogo →
            </a>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
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
          <a href="/patrons" className="btn-ghost text-sm">
            <Users className="h-4 w-4" />
            Gestionar socios
          </a>
          <a href="/catalog" className="btn-ghost text-sm">
            <BookOpen className="h-4 w-4" />
            Ver catálogo
          </a>
        </div>
      </div>
    </div>
  );
}
