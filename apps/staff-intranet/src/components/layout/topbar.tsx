'use client';

import { Bell, Search } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface-card px-6">
      {/* Search */}
      <div className="flex w-72 items-center gap-2 rounded-sm border border-surface-border bg-surface-raised px-3 py-2">
        <Search className="h-3.5 w-3.5 text-text-muted" />
        <input
          type="search"
          placeholder="Buscar socio, ejemplar, préstamo..."
          className="flex-1 bg-transparent font-mono text-xs text-text-secondary placeholder-text-muted focus:outline-none"
        />
        <span className="font-mono text-xs text-text-muted">⌘K</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 rounded-full border border-accent-green/20 bg-accent-green/8 px-3 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-green" />
          <span className="font-mono text-xs text-accent-green">Sistema activo</span>
        </div>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:text-text-primary transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-amber font-mono text-[8px] text-surface-base font-semibold">
            3
          </span>
        </button>

        {/* Current time */}
        <span className="font-mono text-xs text-text-muted" suppressHydrationWarning>
          {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </header>
  );
}
