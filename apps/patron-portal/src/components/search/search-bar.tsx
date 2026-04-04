'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchBarProps {
  variant?: 'hero' | 'inline';
  defaultValue?: string;
}

export default function SearchBar({ variant = 'inline', defaultValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('relative', variant === 'hero' && 'w-full')}>
      <div
        className={clsx(
          'flex items-center overflow-hidden transition-all',
          variant === 'hero'
            ? 'rounded-sm bg-parchment shadow-2xl ring-1 ring-white/20'
            : 'rounded-sm border border-ink/15 bg-white',
        )}
      >
        <Search
          className={clsx(
            'ml-4 shrink-0',
            variant === 'hero' ? 'h-5 w-5 text-ink-muted' : 'h-4 w-4 text-ink-muted',
          )}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            variant === 'hero'
              ? 'Busca por título, autor, ISBN, materia...'
              : 'Buscar en el catálogo...'
          }
          className={clsx(
            'flex-1 bg-transparent px-4 font-body text-ink placeholder-ink-muted focus:outline-none',
            variant === 'hero' ? 'py-5 text-base' : 'py-3 text-sm',
          )}
          aria-label="Buscar en el catálogo bibliográfico"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="px-3 text-ink-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className={clsx(
            'shrink-0 font-body font-medium transition-colors',
            variant === 'hero'
              ? 'bg-amber-book px-8 py-5 text-sm text-white hover:bg-amber-warm'
              : 'bg-ink px-6 py-3 text-sm text-parchment hover:bg-ink-light',
          )}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
