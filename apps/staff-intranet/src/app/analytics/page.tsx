import { Users, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react';
import { obtenerEstadisticas, listarCatalogo } from '@/lib/api';
import AnalyticsCharts from './charts';

export default async function AnalyticsPage() {
  const [estadisticas, catalogData] = await Promise.all([
    obtenerEstadisticas().catch(() => ({
      socios: { total: 0, activos: 0, suspendidos: 0, expirados: 0, bloqueados: 0 },
      circulacion: { prestamosVencidos: 0 },
      catalogTotal: 0,
    })),
    listarCatalogo({ limit: 100, page: 1 }).catch(() => ({ data: [], total: 0 })),
  ]);

  // Contar materiales por tipo
  const byType: Record<string, number> = {};
  for (const item of catalogData.data as Array<{ materialType: string }>) {
    byType[item.materialType] = (byType[item.materialType] ?? 0) + 1;
  }

  const tipoLabels: Record<string, string> = {
    book: 'Libro', journal: 'Revista', audiovisual: 'Audiovisual',
    digital: 'Digital', map: 'Mapa', archive: 'Archivo',
  };

  const tiposData = Object.entries(byType).map(([k, v]) => ({
    name: tipoLabels[k] ?? k, value: v,
  }));

  const patronesData = [
    { name: 'Activos',     value: estadisticas.socios.activos,     fill: '#1FB870' },
    { name: 'Suspendidos', value: estadisticas.socios.suspendidos,  fill: '#EF4444' },
    { name: 'Expirados',   value: estadisticas.socios.expirados ?? 0, fill: '#F59E0B' },
  ];

  const metricas = [
    { label: 'Socios totales',       value: estadisticas.socios.total,             icon: Users,         color: 'text-accent-purple' },
    { label: 'Materiales',           value: estadisticas.catalogTotal,             icon: BookOpen,      color: 'text-accent-blue'   },
    { label: 'Préstamos vencidos',   value: estadisticas.circulacion.prestamosVencidos, icon: AlertTriangle, color: estadisticas.circulacion.prestamosVencidos > 0 ? 'text-accent-amber' : 'text-text-muted' },
    { label: 'Socios activos',       value: estadisticas.socios.activos,           icon: TrendingUp,    color: 'text-accent-green'  },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Estadísticas</h1>
        <p className="font-mono text-xs text-text-muted">Métricas generales del sistema en tiempo real</p>
      </div>

      {/* KPIs */}
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
            </div>
          );
        })}
      </div>

      {/* Gráficos */}
      <AnalyticsCharts
        patronesData={patronesData}
        tiposData={tiposData}
        totalSocios={estadisticas.socios.total}
        totalMateriales={estadisticas.catalogTotal}
        prestamosVencidos={estadisticas.circulacion.prestamosVencidos}
      />
    </div>
  );
}
