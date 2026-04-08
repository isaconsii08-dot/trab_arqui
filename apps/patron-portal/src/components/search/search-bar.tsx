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
          'flex overflow-hidden transition-all',
          variant === 'hero'
            ? 'rounded-sm bg-[#F8EDD5] border border-[#B8860B]/30'
            : 'rounded-sm border border-ink/15 bg-white',
        )}
      >
        <Search
          className={clsx(
            'ml-4 shrink-0 self-center',
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
            'flex-1 px-4 font-body text-ink placeholder-ink-muted/60 focus:outline-none',
            variant === 'hero'
              ? 'py-5 text-base bg-transparent'
              : 'py-3 text-sm bg-transparent',
          )}
          aria-label="Buscar en el catálogo bibliográfico"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="self-center px-3 text-ink-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className={clsx(
            'shrink-0 font-body font-medium transition-colors',
            variant === 'hero'
              ? 'bg-[#2A1208] px-8 py-5 text-sm font-medium text-[#FDF6F0] hover:bg-[#3B1A0A] transition-colors border-l border-[#C8860A]/20'
              : 'bg-[#2A1208] px-6 py-3 text-sm text-[#FDF6F0] hover:bg-[#3B1A0A] transition-colors',
          )}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
