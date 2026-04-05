'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Package } from 'lucide-react';

interface Item {
  id: string;
  barcode: string;
  location: string;
  callNumber: string | null;
  status: string;
  condition: string;
}

interface ItemsManagerProps {
  recordId: string;
  items: Item[];
}

const ESTADO: Record<string, { label: string; badge: string }> = {
  available:   { label: 'Disponible',    badge: 'badge-green' },
  loaned:      { label: 'Prestado',      badge: 'badge-amber' },
  reserved:    { label: 'Reservado',     badge: 'badge-blue'  },
  maintenance: { label: 'Mantenimiento', badge: 'badge-red'   },
  lost:        { label: 'Perdido',       badge: 'badge-red'   },
};

export default function ItemsManager({ recordId, items }: ItemsManagerProps) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ barcode: '', location: 'Sala General', callNumber: '' });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const agregarEjemplar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.barcode.trim()) { setError('El código de barras es obligatorio'); return; }
    setGuardando(true);
    setError('');
    try {
      const res = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: form.barcode.trim(),
          recordId,
          libraryId: 'lib-001',
          location: form.location || 'Sala General',
          callNumber: form.callNumber || null,
        }),
      });
      const data = await res.json() as { message?: string; barcode?: string };
      if (!res.ok) { setError(data.message ?? 'Error al crear el ejemplar'); return; }
      setForm({ barcode: '', location: 'Sala General', callNumber: '' });
      setMostrarForm(false);
      router.refresh();
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-text-muted" />
          <h2 className="font-display text-sm font-semibold text-text-primary">
            Ejemplares ({items.length})
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-accent-green">
            {items.filter((e) => e.status === 'available').length} disponibles
          </span>
          <button
            onClick={() => { setMostrarForm((v) => !v); setError(''); }}
            className="flex items-center gap-1 font-mono text-xs text-accent-green hover:underline"
          >
            <Plus className="h-3 w-3" /> Agregar ejemplar
          </button>
        </div>
      </div>

      {/* Formulario para agregar */}
      {mostrarForm && (
        <div className="border-b border-surface-border bg-surface-raised/40 px-4 py-4">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">Nuevo ejemplar</p>
          {error && (
            <p className="mb-3 rounded-sm border border-accent-red/20 bg-accent-red/8 px-3 py-2 font-mono text-xs text-accent-red">{error}</p>
          )}
          <form onSubmit={agregarEjemplar} className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block font-mono text-xs text-text-muted">Código de barras *</label>
              <input
                type="text"
                required
                value={form.barcode}
                onChange={(e) => set('barcode', e.target.value)}
                placeholder="EJ001-05"
                className="input-dark text-xs"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs text-text-muted">Ubicación</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="Sala General"
                className="input-dark text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs text-text-muted">Signatura</label>
              <input
                type="text"
                value={form.callNumber}
                onChange={(e) => set('callNumber', e.target.value)}
                placeholder="CO GAR c"
                className="input-dark text-xs"
              />
            </div>
            <div className="col-span-3 flex gap-2">
              <button type="submit" disabled={guardando} className="btn-green text-xs">
                {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {guardando ? 'Guardando...' : 'Registrar ejemplar'}
              </button>
              <button type="button" onClick={() => setMostrarForm(false)} className="btn-ghost text-xs">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de ejemplares */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Package className="mb-2 h-8 w-8 text-text-muted/20" />
          <p className="font-mono text-xs text-text-muted">Sin ejemplares. Agrega el primero.</p>
        </div>
      ) : (
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Código de barras</th>
              <th>Ubicación</th>
              <th>Signatura</th>
              <th>Estado</th>
              <th>Condición</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const est = ESTADO[item.status] ?? { label: item.status, badge: '' };
              return (
                <tr key={item.id} className="table-row">
                  <td className="font-mono text-xs">{item.barcode}</td>
                  <td className="text-text-secondary">{item.location}</td>
                  <td className="font-mono text-xs text-text-muted">{item.callNumber ?? '—'}</td>
                  <td><span className={`badge ${est.badge}`}>{est.label}</span></td>
                  <td className="font-mono text-xs text-text-muted capitalize">{item.condition}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
