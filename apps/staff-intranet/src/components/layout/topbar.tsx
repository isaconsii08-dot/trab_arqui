'use client';

import { useRouter } from 'next/navigation';
import { Bell, Search, User, Book, Loader2, X, Command } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Result {
  id: string;
  type: 'patron' | 'book';
  title: string;
  subtitle: string;
  extra?: string; // carnet o barcode
}

export default function TopBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Búsqueda en tiempo real
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Buscamos en ambos servicios vía API del staff-intranet
        const [patronRes, catalogRes] = await Promise.all([
          fetch(`/api/circulacion/lookup?type=patron&q=${encodeURIComponent(q)}`),
          fetch(`/api/circulacion/lookup?type=catalog&q=${encodeURIComponent(q)}`)
        ]);

        const patrons = await patronRes.json();
        const books = await catalogRes.json();

        const combined: Result[] = [
          ...(patrons.data || []).map((p: any) => ({
            id: p.id,
            type: 'patron' as const,
            title: p.fullName,
            subtitle: p.email,
            extra: p.cardNumber
          })),
          ...(books.data || []).map((b: any) => ({
            id: b.id,
            type: 'book' as const,
            title: b.title,
            subtitle: b.authors?.[0]?.name || 'Autor desconocido',
            extra: b.isbn
          }))
        ];

        setResults(combined.slice(0, 8)); // limitamos a 8
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const selectResult = (res: Result) => {
    setQuery('');
    setShowResults(false);
    if (res.type === 'patron') {
      router.push(`/patrons?query=${encodeURIComponent(res.extra || '')}`);
    } else {
      router.push(`/catalog/${res.id}`);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface-card px-6">
      {/* Intelligent Omnibox */}
      <div className="relative w-96" ref={containerRef}>
        <div className="flex items-center gap-2 rounded-sm border border-surface-border bg-surface-raised px-3 py-2 transition-focus-within focus-within:border-accent-amber/50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-amber" /> : <Search className="h-3.5 w-3.5 text-text-muted" />}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 3 && setShowResults(true)}
            placeholder="Buscar socio por nombre, carnet, libro..."
            className="flex-1 bg-transparent font-mono text-xs text-text-secondary placeholder-text-muted focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary">
              <X className="h-3 w-3" />
            </button>
          )}
          {!query && <Command className="h-3 w-3 text-text-muted opacity-40" />}
        </div>

        {/* Results Dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-sm border border-surface-border bg-surface-card shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="max-h-96 overflow-y-auto py-2">
              {results.map((res) => (
                <button
                  key={`${res.type}-${res.id}`}
                  onClick={() => selectResult(res)}
                  className="flex w-full items-start gap-3 px-4 py-2 hover:bg-surface-raised text-left transition-colors"
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm ${res.type === 'patron' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-accent-amber/10 text-accent-amber'}`}>
                    {res.type === 'patron' ? <User className="h-3.5 w-3.5" /> : <Book className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-text-primary">{res.title}</p>
                    <p className="truncate font-mono text-[10px] text-text-muted uppercase tracking-wider">
                      {res.subtitle} {res.extra && `· ${res.extra}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right actions */}
...
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
