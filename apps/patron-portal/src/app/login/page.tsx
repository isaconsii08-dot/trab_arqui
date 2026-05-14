'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

import { LoadingModal } from '@/components/ui/skeleton';

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
    <>
    {isLoading && <LoadingModal label="Iniciando sesión..." />}
    <div className="flex min-h-screen">
      {/* Panel decorativo — terracota papel */}
      <div
        className="relative hidden flex-1 overflow-hidden lg:block"
        style={{ backgroundColor: '#6B2A1A' }}
      >
        {/* Grain noise del papel */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 0.1,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: '256px 256px',
          }}
        />
        {/* Líneas de papel */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, rgba(237,207,196,0.08) 39px, rgba(237,207,196,0.08) 40px)',
          }}
        />
        {/* Manchas de tinta / blobs */}
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full opacity-30 blur-[100px]" style={{ backgroundColor: '#C1614A' }} />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: '#8B3A27' }} />
        {/* Borde rasgado derecho */}
        <div className="absolute right-0 top-0 bottom-0 z-10 w-8 overflow-hidden">
          <svg viewBox="0 0 32 800" preserveAspectRatio="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M32,0 L20,0 C22,60 18,100 24,160 C28,200 16,240 20,300 C24,360 30,380 22,440 C16,490 26,530 20,590 C14,640 28,680 24,740 C20,780 18,800 32,800 Z"
              fill="#F5EFE0"
            />
          </svg>
        </div>
        <div className="relative flex h-full flex-col justify-between p-12 pr-16">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/LogoBiblioFlow.png"
              alt="BiblioFlow"
              width={130}
              height={27}
              className="h-7 w-auto"
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.75 }}
            />
          </Link>
          <div>
            <blockquote className="mb-8">
              <p className="font-display text-2xl italic leading-relaxed" style={{ color: 'rgba(237,207,196,0.85)' }}>
                &ldquo;Una biblioteca es un hospital para la mente&rdquo;
              </p>
              <footer className="mt-3 font-mono text-xs" style={{ color: 'rgba(237,207,196,0.45)' }}>— Proverbio anónimo</footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 flex-col items-center justify-center bg-parchment-light px-6 py-12 lg:max-w-xl">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center lg:hidden">
            <Image
              src="/LogoBiblioFlow.png"
              alt="BiblioFlow"
              width={120}
              height={25}
              className="h-6 w-auto"
            />
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
              Acceder <ArrowRight className="h-4 w-4" />
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
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
