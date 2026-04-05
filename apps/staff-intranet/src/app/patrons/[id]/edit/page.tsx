'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PatronDto {
  id: string; fullName: string; email: string; phone: string | null;
  address: string | null; status: string; cardNumber: string;
}

const ESTADOS = [
  { value: 'active',    label: 'Activo'      },
  { value: 'suspended', label: 'Suspendido'  },
  { value: 'expired',   label: 'Expirado'    },
  { value: 'blocked',   label: 'Bloqueado'   },
];

export default function EditPatronPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ phone: '', address: '', status: 'active' });
  const [socio, setSocio] = useState<PatronDto | null>(null);

  useEffect(() => {
    fetch(`/api/socios/${id}`)
      .then((r) => r.ok ? r.json() as Promise<PatronDto> : null)
      .then((data) => {
        if (data) {
          setSocio(data);
          setForm({ phone: data.phone ?? '', address: data.address ?? '', status: data.status });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/socios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) { setError(data.message ?? 'Error al guardar'); return; }
      router.push(`/patrons/${id}`);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar al socio ${socio?.fullName}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/socios/${id}`, { method: 'DELETE' });
      router.push('/patrons');
    } catch {
      setError('No se pudo eliminar el socio');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
    </div>
  );

  if (!socio) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <p className="font-mono text-sm text-text-muted">Socio no encontrado</p>
      <Link href="/patrons" className="btn-ghost text-sm">← Volver</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href={`/patrons/${id}`} className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Editar socio</h1>
          <p className="font-mono text-xs text-text-muted">{socio.cardNumber} · {socio.fullName}</p>
        </div>
      </div>

      <div className="surface-card p-6">
        {error && (
          <div className="mb-4 rounded-sm border border-accent-red/20 bg-accent-red/8 px-4 py-3 font-mono text-xs text-accent-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-sm border border-surface-border bg-surface-raised/30 p-4 font-mono text-xs text-text-muted">
            <div><span className="block text-text-muted/60">Nombre</span><span className="text-text-secondary">{socio.fullName}</span></div>
            <div><span className="block text-text-muted/60">Email</span><span className="text-text-secondary">{socio.email}</span></div>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs text-text-muted">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="input-dark"
            >
              {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs text-text-muted">Teléfono</label>
            <input
              type="tel"
              placeholder="300 123 4567"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="input-dark"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-xs text-text-muted">Dirección</label>
            <input
              type="text"
              placeholder="Calle 10 # 5-20, Bogotá"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="input-dark"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-green">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <Link href={`/patrons/${id}`} className="btn-ghost">Cancelar</Link>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-sm border border-accent-red/20 px-3 py-2.5 font-body text-sm text-accent-red/70 transition-colors hover:bg-accent-red/10 hover:text-accent-red"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Eliminar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
