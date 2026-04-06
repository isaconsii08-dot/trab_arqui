'use client';

import { useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useState } from 'react';

export default function TopBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // Carnet: LIB-XXXX → socios; todo lo demás (título, ISBN, barcode) → catálogo
    if (/^LIB-/i.test(q)) {
      router.push(`/patrons?query=${encodeURIComponent(q)}`);
    } else {
      router.push(`/catalog?query=${encodeURIComponent(q)}`);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface-card px-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex w-72 items-center gap-2 rounded-sm border border-surface-border bg-surface-raised px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar socio, libro, ejemplar..."
          className="flex-1 bg-transparent font-mono text-xs text-text-secondary placeholder-text-muted focus:outline-none"
        />
        <span className="font-mono text-xs text-text-muted">↵</span>
      </form>

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
        </button>

        {/* Current time — 12h */}
        <span className="font-mono text-xs text-text-muted" suppressHydrationWarning>
          {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </span>
      </div>
    </header>
  );
}
