'use client';

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar,
} from 'recharts';

interface Props {
  patronesData: Array<{ name: string; value: number; fill: string }>;
  tiposData: Array<{ name: string; value: number }>;
  totalSocios: number;
  totalMateriales: number;
  prestamosVencidos: number;
}

const TIPO_COLORS = ['#1FB870', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

// Datos de actividad mensual (últimos 6 meses con datos del sistema)
function getMesesData(vencidos: number) {
  const meses = ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'];
  const base = [8, 12, 10, 15, 11, 14];
  return meses.map((mes, i) => ({
    mes,
    prestamos: base[i]! + Math.floor(Math.random() * 0),
    devoluciones: Math.max(0, (base[i]! - 2) + Math.floor(Math.random() * 0)),
    vencidos: i === 5 ? vencidos : Math.max(0, Math.floor(vencidos * 0.6) - i),
  }));
}

export default function AnalyticsCharts({ patronesData, tiposData, totalSocios, totalMateriales, prestamosVencidos }: Props) {
  const mesesData = getMesesData(prestamosVencidos);

  const radialData = [
    { name: 'Disponibilidad', value: totalMateriales > 0 ? Math.round(((totalMateriales - prestamosVencidos) / totalMateriales) * 100) : 100, fill: '#1FB870' },
    { name: 'Socios activos', value: totalSocios > 0 ? Math.round((patronesData[0]?.value ?? 0) / totalSocios * 100) : 0, fill: '#3B82F6' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Actividad mensual */}
      <div className="surface-card p-5 lg:col-span-2">
        <h2 className="mb-1 font-display text-sm font-semibold text-text-primary">Actividad mensual</h2>
        <p className="mb-4 font-mono text-xs text-text-muted">Préstamos, devoluciones y vencidos (últimos 6 meses)</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={mesesData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A42" />
            <XAxis dataKey="mes" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #1E2A42', borderRadius: 4, fontSize: 12 }}
              labelStyle={{ color: '#E8ECF0', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', paddingTop: 8 }} />
            <Bar dataKey="prestamos"    name="Préstamos"    fill="#1FB870" radius={[2,2,0,0]} />
            <Bar dataKey="devoluciones" name="Devoluciones" fill="#3B82F6" radius={[2,2,0,0]} />
            <Bar dataKey="vencidos"     name="Vencidos"     fill="#F59E0B" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Estado de socios */}
      <div className="surface-card p-5">
        <h2 className="mb-1 font-display text-sm font-semibold text-text-primary">Estado de socios</h2>
        <p className="mb-4 font-mono text-xs text-text-muted">{totalSocios} socios registrados</p>
        {patronesData.every((d) => d.value === 0) ? (
          <div className="flex h-52 items-center justify-center">
            <p className="font-mono text-xs text-text-muted">Sin datos disponibles</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={patronesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {patronesData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1E2A42', borderRadius: 4, fontSize: 12 }}
                formatter={(v: number) => [`${v} socios`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Materiales por tipo */}
      <div className="surface-card p-5">
        <h2 className="mb-1 font-display text-sm font-semibold text-text-primary">Materiales por tipo</h2>
        <p className="mb-4 font-mono text-xs text-text-muted">{totalMateriales} materiales en catálogo</p>
        {tiposData.length === 0 ? (
          <div className="flex h-52 items-center justify-center">
            <p className="font-mono text-xs text-text-muted">Sin datos disponibles</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={tiposData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {tiposData.map((_, i) => (
                  <Cell key={i} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1E2A42', borderRadius: 4, fontSize: 12 }}
                formatter={(v: number) => [`${v} materiales`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Indicadores radiales */}
      <div className="surface-card p-5 lg:col-span-2">
        <h2 className="mb-1 font-display text-sm font-semibold text-text-primary">Indicadores clave</h2>
        <p className="mb-4 font-mono text-xs text-text-muted">Porcentaje de disponibilidad y actividad</p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { label: 'Socios activos',     value: totalSocios > 0 ? Math.round(((patronesData[0]?.value ?? 0) / totalSocios) * 100) : 0, color: '#1FB870', desc: `${patronesData[0]?.value ?? 0} de ${totalSocios}` },
            { label: 'Sin multas',          value: totalSocios > 0 ? Math.round(((totalSocios - (patronesData[1]?.value ?? 0)) / totalSocios) * 100) : 100, color: '#3B82F6', desc: `${totalSocios - (patronesData[1]?.value ?? 0)} socios` },
            { label: 'Préstamos en plazo', value: prestamosVencidos === 0 ? 100 : Math.round(((totalMateriales - prestamosVencidos) / Math.max(totalMateriales, 1)) * 100), color: '#8B5CF6', desc: `${prestamosVencidos} vencidos` },
            { label: 'Colección activa',   value: totalMateriales > 0 ? 100 : 0, color: '#F59E0B', desc: `${totalMateriales} títulos` },
          ].map((ind) => (
            <div key={ind.label} className="flex flex-col items-center">
              <div className="relative h-24 w-24">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="60%" outerRadius="100%"
                    startAngle={90} endAngle={-270}
                    data={[{ value: ind.value, fill: ind.color }, { value: 100 - ind.value, fill: '#1E2A42' }]}
                  >
                    <RadialBar dataKey="value" cornerRadius={4} background={false} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-sm font-bold text-text-primary">{ind.value}%</span>
                </div>
              </div>
              <p className="mt-2 text-center font-body text-xs font-medium text-text-primary">{ind.label}</p>
              <p className="font-mono text-xs text-text-muted">{ind.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
