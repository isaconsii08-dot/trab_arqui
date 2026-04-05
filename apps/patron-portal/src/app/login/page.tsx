'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === '1';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const body = await res.json() as { error?: string };
        setLoginError(body.error ?? 'Correo o contraseña incorrectos');
      }
    } catch {
      setLoginError('No se pudo conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel decorativo */}
      <div className="relative hidden flex-1 overflow-hidden bg-ink lg:block">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(245,239,224,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,239,224,0.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-emerald-library/20 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-amber-book/20">
              <BookOpen className="h-4 w-4 text-amber-book" />
            </div>
            <span className="font-display text-lg font-semibold text-parchment">
              Biblio<span className="text-amber-book">Flow</span>
            </span>
          </Link>
          <div>
            <blockquote className="mb-8">
              <p className="font-display text-2xl italic leading-relaxed text-parchment/80">
                &ldquo;Una biblioteca es un hospital para la mente&rdquo;
              </p>
              <footer className="mt-3 font-mono text-xs text-parchment/40">— Proverbio anónimo</footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 flex-col items-center justify-center bg-parchment-light px-6 py-12 lg:max-w-xl">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <BookOpen className="h-5 w-5 text-amber-book" />
            <span className="font-display text-base font-semibold text-ink">BiblioFlow</span>
          </Link>

          <h1 className="heading-md mb-2 text-ink">Bienvenido de vuelta</h1>
          <p className="mb-8 text-sm text-ink-muted">
            Accede a tu cuenta para gestionar tus préstamos y reservas.
          </p>

          {registered && (
            <div className="mb-4 flex items-center gap-2 rounded-sm border border-emerald-library/30 bg-emerald-library/8 px-4 py-3 font-body text-sm text-emerald-library">
              <CheckCircle className="h-4 w-4 shrink-0" />
              ¡Cuenta creada! Ya puedes iniciar sesión.
            </div>
          )}

          {loginError && (
            <div className="mb-4 rounded-sm border border-rust/30 bg-rust/5 px-4 py-3 font-body text-sm text-rust">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block font-body text-sm font-medium text-ink">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="font-body text-sm font-medium text-ink">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-amber w-full justify-center disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Iniciando sesión...
                </span>
              ) : (
                <>Acceder <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-xs text-ink-muted">
            Cuenta de prueba: <span className="font-mono">sgomez@ucc.edu.co</span> / <span className="font-mono">Socio2026!</span>
          </p>

          <p className="mt-4 text-center font-body text-sm text-ink-muted">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-amber-book hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
