import { BarChart2, TrendingUp, Users, BookOpen, AlertTriangle } from 'lucide-react';
import { obtenerEstadisticas } from '@/lib/api';

export default async function AnalyticsPage() {
  const estadisticas = await obtenerEstadisticas().catch(() => ({
    socios: { total: 0, activos: 0, suspendidos: 0, expirados: 0 },
    circulacion: { prestamosVencidos: 0 },
    catalogTotal: 0,
  }));

  const metricas = [
    {
      label: 'Socios totales',
      value: estadisticas.socios.total,
      sub: `${estadisticas.socios.activos} activos`,
      icon: Users,
      color: 'text-accent-purple',
    },
    {
      label: 'Materiales en catálogo',
      value: estadisticas.catalogTotal,
      sub: 'Títulos registrados',
      icon: BookOpen,
      color: 'text-accent-blue',
    },
    {
      label: 'Préstamos vencidos',
      value: estadisticas.circulacion.prestamosVencidos,
      sub: 'Pendientes de devolución',
      icon: AlertTriangle,
      color: estadisticas.circulacion.prestamosVencidos > 0 ? 'text-accent-amber' : 'text-text-muted',
    },
    {
      label: 'Socios suspendidos',
      value: estadisticas.socios.suspendidos,
      sub: 'Con restricciones activas',
      icon: TrendingUp,
      color: estadisticas.socios.suspendidos > 0 ? 'text-accent-red' : 'text-text-muted',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Estadísticas</h1>
        <p className="font-mono text-xs text-text-muted">Métricas generales del sistema</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricas.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="stat-card">
              <Icon className={`h-5 w-5 ${m.color}`} />
              <div className="mt-3 font-display text-2xl font-semibold text-text-primary">
                {m.value.toLocaleString()}
              </div>
              <div className="mt-1 font-body text-xs text-text-muted">{m.label}</div>
              <div className="mt-0.5 font-mono text-xs text-text-muted/70">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="surface-card p-8 flex flex-col items-center text-center">
        <BarChart2 className="mb-4 h-12 w-12 text-text-muted/20" />
        <p className="font-display text-sm font-semibold text-text-primary">Gráficos de actividad</p>
        <p className="mt-1 font-mono text-xs text-text-muted">
          Visualizaciones detalladas de préstamos, devoluciones y tendencias próximamente.
        </p>
      </div>
    </div>
  );
}
