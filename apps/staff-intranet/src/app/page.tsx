import {
  BookOpen,
  Users,
  AlertTriangle,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { obtenerEstadisticas, obtenerPrestamosActivos, listarCatalogo, type LoanConDetalle } from '@/lib/api';
import { LoansTable } from '@/components/ui/loans-table';
import { RefreshButton } from '@/components/ui/refresh-button';

export const dynamic = 'force-dynamic';

interface Loan {
  id: string;
  itemId: string;
  itemBarcode: string;
  itemTitle: string;
  patronId: string;
  patronName?: string;
  dueDate: string;
  status: string;
}

interface CatalogRecord {
  id: string;
  title: string;
  authors?: Array<{ name: string }>;
}

interface Solicitud {
  id: string;
  bookTitle: string;
  userName: string;
  estado: string;
  creadaEn: string;
}

export default async function DashboardPage() {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Obtener datos reales en paralelo
  const [estadisticas, prestamosVencidos, catalogData, solicitudesRaw] = await Promise.all([
    obtenerEstadisticas().catch(() => ({
      socios: { total: 0, activos: 0, suspendidos: 0, expirados: 0 },
      circulacion: { prestamosVencidos: 0 },
      catalogTotal: 0,
    })),
    obtenerPrestamosActivos().catch(() => [] as LoanConDetalle[]),
    listarCatalogo({ limit: 5, page: 1 }).catch(() => ({ data: [] as CatalogRecord[], total: 0 })),
    fetch('http://localhost:4000/api/prestamos', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() as Promise<Solicitud[]> : [] as Solicitud[])
      .catch(() => [] as Solicitud[]),
  ]);

  const loans = prestamosVencidos as LoanConDetalle[];
  const topTitulos = (catalogData.data as CatalogRecord[]).slice(0, 5);
  const solicitudes = (solicitudesRaw as Solicitud[]).slice(0, 10);
  const pendientesCount = solicitudes.filter((s) => s.estado === 'pendiente').length;

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Dashboard operacional</h1>
          <p className="mt-0.5 font-mono text-xs capitalize text-text-muted">{today}</p>
        </div>
        <RefreshButton />
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
            <h2 className="font-display text-sm font-semibold text-text-primary">Ejemplares en préstamo ({loans.length})</h2>
            <a href="/circulation" className="font-mono text-xs text-accent-green hover:underline">
              Ver circulación →
            </a>
          </div>

          <LoansTable loans={loans as Loan[]} />
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

      {/* Solicitudes de préstamo en línea */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-text-muted" />
            <h2 className="font-display text-sm font-semibold text-text-primary">
              Solicitudes de préstamo en línea
            </h2>
            {pendientesCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-amber px-1 font-mono text-[10px] font-bold text-white">
                {pendientesCount}
              </span>
            )}
          </div>
          <Link href="/circulation" className="font-mono text-xs text-accent-green hover:underline">
            Gestionar →
          </Link>
        </div>

        {solicitudes.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Inbox className="mb-2 h-6 w-6 text-text-muted/20" />
            <p className="font-mono text-xs text-text-muted">Sin solicitudes registradas</p>
          </div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Libro</th>
                <th>Socio</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} className="table-row">
                  <td className="max-w-[220px] truncate font-body text-sm">{s.bookTitle}</td>
                  <td className="text-text-secondary">{s.userName}</td>
                  <td className="font-mono text-xs text-text-muted">
                    {new Date(s.creadaEn).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td>
                    <span className={`badge ${
                      s.estado === 'pendiente'  ? 'badge-amber' :
                      s.estado === 'aprobada'   ? 'badge-green' :
                      s.estado === 'entregada'  ? 'badge-green' :
                      'badge-red'
                    }`}>
                      {s.estado === 'pendiente' ? 'Pendiente' :
                       s.estado === 'aprobada'  ? 'Aprobada'  :
                       s.estado === 'entregada' ? 'Entregada' : 'Rechazada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
