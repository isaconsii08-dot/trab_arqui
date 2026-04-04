'use client';

import { useRouter, usePathname } from 'next/navigation';

interface SearchFiltersProps {
  currentFilters: Record<string, string | undefined>;
}

const MATERIAL_TYPES = [
  { value: 'book', label: 'Libro' },
  { value: 'journal', label: 'Revista' },
  { value: 'audiovisual', label: 'Audiovisual' },
  { value: 'digital', label: 'Recurso digital' },
  { value: 'map', label: 'Mapa' },
  { value: 'archive', label: 'Archivo' },
];

const SUBJECTS = [
  'Literatura', 'Historia', 'Ciencias', 'Filosofía', 'Arte',
  'Tecnología', 'Derecho', 'Medicina', 'Economía', 'Educación',
];

export default function SearchFiltersPanel({ currentFilters }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const applyFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams();
    Object.entries({ ...currentFilters, [key]: value }).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    // Reset to page 1 on filter change
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => router.push(pathname);

  return (
    <div className="space-y-6">
      {/* Active filters indicator */}
      {Object.keys(currentFilters).filter((k) => k !== 'query' && currentFilters[k]).length > 0 && (
        <button onClick={clearAll} className="font-mono text-xs text-rust hover:underline">
          Limpiar todos los filtros
        </button>
      )}

      {/* Material type */}
      <div>
        <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-ink-muted">Tipo de material</h3>
        <div className="space-y-2">
          {MATERIAL_TYPES.map((type) => (
            <label key={type.value} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="materialType"
                value={type.value}
                checked={currentFilters.materialType === type.value}
                onChange={() => applyFilter('materialType', type.value)}
                className="accent-amber-book"
              />
              <span className="font-body text-sm text-ink">{type.label}</span>
            </label>
          ))}
          {currentFilters.materialType && (
            <button
              onClick={() => applyFilter('materialType', undefined)}
              className="font-mono text-xs text-rust hover:underline"
            >
              Quitar filtro
            </button>
          )}
        </div>
      </div>

      {/* Publication year */}
      <div>
        <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-ink-muted">Año de publicación</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Desde"
            min="1000"
            max="2099"
            defaultValue={currentFilters.yearFrom}
            onBlur={(e) => applyFilter('yearFrom', e.target.value || undefined)}
            className="input-field py-2 text-xs w-full"
          />
          <span className="text-ink-muted">–</span>
          <input
            type="number"
            placeholder="Hasta"
            min="1000"
            max="2099"
            defaultValue={currentFilters.yearTo}
            onBlur={(e) => applyFilter('yearTo', e.target.value || undefined)}
            className="input-field py-2 text-xs w-full"
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-ink-muted">Materia</h3>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => applyFilter('subject', currentFilters.subject === subject ? undefined : subject)}
              className={`rounded-sm px-2.5 py-1 font-mono text-xs transition-colors ${
                currentFilters.subject === subject
                  ? 'bg-ink text-parchment'
                  : 'border border-ink/15 text-ink-muted hover:border-amber-book hover:text-amber-book'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.15em] text-ink-muted">Disponibilidad</h3>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={currentFilters.available === 'true'}
            onChange={(e) => applyFilter('available', e.target.checked ? 'true' : undefined)}
            className="accent-amber-book"
          />
          <span className="font-body text-sm text-ink">Solo disponibles ahora</span>
        </label>
      </div>
    </div>
  );
}
