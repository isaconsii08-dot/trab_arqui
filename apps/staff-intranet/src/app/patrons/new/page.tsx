'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewPatronPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', address: '', password: '', libraryId: 'lib-001',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/socios/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) { setError(data.message ?? 'Error al crear el socio'); return; }
      router.push('/patrons');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/patrons" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Nuevo socio</h1>
          <p className="font-mono text-xs text-text-muted">Registrar un nuevo miembro de la biblioteca</p>
        </div>
      </div>

      <div className="surface-card p-6">
        {error && (
          <div className="mb-4 rounded-sm border border-accent-red/20 bg-accent-red/8 px-4 py-3 font-mono text-xs text-accent-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'fullName', label: 'Nombre completo', type: 'text',     placeholder: 'Ej: Carlos Andrés Pérez', required: true  },
            { key: 'email',    label: 'Correo electrónico', type: 'email', placeholder: 'socio@ucc.edu.co',       required: true  },
            { key: 'phone',    label: 'Teléfono',          type: 'tel',   placeholder: '300 123 4567',           required: false },
            { key: 'address',  label: 'Dirección',         type: 'text',  placeholder: 'Calle 10 # 5-20, Bogotá',required: false },
            { key: 'password', label: 'Contraseña inicial',type: 'text',  placeholder: 'Mínimo 8 caracteres',    required: true  },
          ].map(({ key, label, type, placeholder, required }) => (
            <div key={key}>
              <label className="mb-1.5 block font-mono text-xs text-text-muted">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                required={required}
                minLength={key === 'password' ? 8 : undefined}
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key, e.target.value)}
                className="input-dark"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-green">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {loading ? 'Registrando...' : 'Crear socio'}
            </button>
            <Link href="/patrons" className="btn-ghost">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
