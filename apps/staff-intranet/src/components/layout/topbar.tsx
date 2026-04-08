'use client';

import { Bell, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TopBar() {
  const [time, setTime] = useState('');
  const [healthyCount, setHealthyCount] = useState<number | null>(null);
  const [totalServices] = useState(4);

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkHealth = () => {
      fetch('/api/status')
        .then((r) => r.json())
        .then((data: Array<{ status: string }>) => {
          setHealthyCount(data.filter((s) => s.status === 'ok').length);
        })
        .catch(() => setHealthyCount(0));
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOk = healthyCount === totalServices;
  const someDown = healthyCount !== null && healthyCount < totalServices;

  return (
    <header className="flex h-14 items-center justify-end border-b border-surface-border bg-surface-card px-6 gap-3">
      {/* Sistema activo indicator — conectado a /api/status */}
      <Link
        href="/status"
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors ${
          allOk
            ? 'border-accent-green/20 bg-accent-green/8 text-accent-green hover:bg-accent-green/15'
            : someDown
            ? 'border-accent-amber/20 bg-accent-amber/8 text-accent-amber hover:bg-accent-amber/15'
            : 'border-surface-border bg-surface-raised text-text-muted hover:bg-surface-raised'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${allOk ? 'bg-accent-green animate-pulse' : someDown ? 'bg-accent-amber animate-pulse' : 'bg-text-muted'}`} />
        <span className="font-mono text-xs">
          {healthyCount === null ? 'Verificando...' : allOk ? 'Sistema activo' : `${healthyCount}/${totalServices} servicios`}
        </span>
        <Activity className="h-3 w-3 opacity-60" />
      </Link>

      {/* Notifications */}
      <button className="relative flex h-8 w-8 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:text-text-primary transition-colors">
        <Bell className="h-4 w-4" />
      </button>

      {/* Clock */}
      <span className="font-mono text-xs text-text-muted" suppressHydrationWarning>
        {time}
      </span>
    </header>
  );
}
