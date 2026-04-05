'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import Navbar from '@/components/layout/navbar';

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', address: '',
    password: '', libraryId: 'lib-001',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          address: form.address || undefined,
          password: form.password,
          libraryId: form.libraryId,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'Error al registrarse');
        setError(msg);
        return;
      }

      router.push('/login?registered=1');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-lg px-6 py-16">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-ink">
              <BookOpen className="h-6 w-6 text-parchment" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">Registro de socio</h1>
            <p className="mt-2 font-body text-sm text-ink-muted">
              Crea tu cuenta para acceder al catálogo y gestionar préstamos.
            </p>
          </div>

          <div className="card p-8">
            {error && (
              <div className="mb-6 rounded-sm border border-rust/30 bg-rust/5 px-4 py-3 font-body text-sm text-rust">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: 'fullName',  label: 'Nombre completo *',   type: 'text',  placeholder: 'Ej: Carlos Andrés Pérez', required: true  },
                { name: 'email',     label: 'Correo electrónico *', type: 'email', placeholder: 'socio@ucc.edu.co',         required: true  },
                { name: 'phone',     label: 'Teléfono',             type: 'tel',   placeholder: '300 123 4567',             required: false },
                { name: 'address',   label: 'Dirección',            type: 'text',  placeholder: 'Calle 10 # 5-20, Bogotá', required: false },
              ].map((campo) => (
                <div key={campo.name}>
                  <label className="mb-1 block font-body text-sm font-medium text-ink">
                    {campo.label}
                  </label>
                  <input
                    type={campo.type}
                    placeholder={campo.placeholder}
                    className="input-field w-full"
                    value={form[campo.name as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [campo.name]: e.target.value })}
                    required={campo.required}
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block font-body text-sm font-medium text-ink">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    className="input-field w-full pr-10"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password && form.password.length < 8 && (
                  <p className="mt-1 font-mono text-xs text-rust">Mínimo 8 caracteres</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-amber w-full justify-center"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Registrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Crear cuenta <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            <p className="mt-6 text-center font-body text-sm text-ink-muted">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-amber-book hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>

          <div className="mt-6 space-y-2">
            {[
              'Acceso al catálogo completo de más de 20 títulos',
              'Gestiona tus préstamos y renuévalos en línea',
              'Reserva salas de estudio con un clic',
            ].map((b) => (
              <div key={b} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-library" />
                <span className="font-body text-xs text-ink-muted">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
