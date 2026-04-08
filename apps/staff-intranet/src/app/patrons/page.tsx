import { Search, UserPlus, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Ban } from 'lucide-react';
import { RefreshButton } from '@/components/ui/refresh-button';
import Link from 'next/link';
import { listarSocios } from '@/lib/api';

interface PageProps {
  searchParams: Promise<{ page?: string; query?: string }>;
}

function copFormat(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

export default async function PatronsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const query = params.query ?? '';

  const resultado = await listarSocios(page, 8, query).catch(() => ({
    data: [] as Array<{
      id: string; cardNumber: string; fullName: string; email: string;
      status: string; phone: string | null; pendingFinesTotal: number;
    }>,
    total: 0,
    page: 1,
    limit: 20,
  }));

  const totalPages = Math.ceil(resultado.total / resultado.limit);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Gestión de socios</h1>
          <p className="font-mono text-xs text-text-muted">
            {resultado.total.toLocaleString('es-CO')} socios registrados
            {query && ` — resultados para "${query}"`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Link href="/patrons/new" className="btn-green">
            <UserPlus className="h-4 w-4" />
            Nuevo socio
          </Link>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <form method="get" className="flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-sm border border-surface-border bg-surface-raised px-3 py-2.5">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            name="query"
            type="search"
            defaultValue={query}
            placeholder="Buscar por nombre, email o nº de carnet..."
            className="flex-1 bg-transparent font-body text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
        </div>
        <button type="submit" className="btn-green">Buscar</button>
        {query && (
          <Link href="/patrons" className="btn-ghost">Limpiar</Link>
        )}
      </form>

      {/* Tabla */}
      <div className="surface-card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Socio</th>
              <th>Nº Carnet</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Multas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {resultado.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center font-mono text-xs text-text-muted">
                  No se encontraron socios
                </td>
              </tr>
            ) : (
              resultado.data.map((patron) => (
                <tr key={patron.id} className="table-row">
                  <td className="font-medium">{patron.fullName}</td>
                  <td className="font-mono text-xs text-text-muted">{patron.cardNumber}</td>
                  <td className="text-text-secondary">{patron.email}</td>
                  <td>
                    {patron.status === 'active' && (
                      <span className="badge badge-green"><CheckCircle className="mr-1 h-3 w-3" />Activo</span>
                    )}
                    {patron.status === 'suspended' && (
                      <span className="badge badge-red"><XCircle className="mr-1 h-3 w-3" />Suspendido</span>
                    )}
                    {patron.status === 'expired' && (
                      <span className="badge badge-amber"><Clock className="mr-1 h-3 w-3" />Caducado</span>
                    )}
                    {patron.status === 'blocked' && (
                      <span className="badge badge-red"><Ban className="mr-1 h-3 w-3" />Bloqueado</span>
                    )}
                  </td>
                  <td className={`font-mono text-sm font-medium ${(patron.pendingFinesTotal ?? 0) > 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                    {(patron.pendingFinesTotal ?? 0) > 0
                      ? copFormat(patron.pendingFinesTotal)
                      : '—'}
                  </td>
                  <td>
                    <Link href={`/patrons/${patron.id}`} className="font-mono text-xs text-accent-green hover:underline">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-text-muted">
            Página {page} de {totalPages} · {resultado.total} socios
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={`/patrons?page=${page - 1}${query ? `&query=${encodeURIComponent(query)}` : ''}`}
              aria-disabled={page === 1}
              className={`flex h-7 w-7 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:bg-surface-raised ${page === 1 ? 'pointer-events-none opacity-30' : ''}`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/patrons?page=${p}${query ? `&query=${encodeURIComponent(query)}` : ''}`}
                className={`flex h-7 w-7 items-center justify-center rounded-sm border font-mono text-xs transition-colors ${
                  p === page
                    ? 'border-accent-green bg-accent-green/10 text-accent-green'
                    : 'border-surface-border text-text-muted hover:bg-surface-raised'
                }`}
              >
                {p}
              </Link>
            ))}
            <Link
              href={`/patrons?page=${page + 1}${query ? `&query=${encodeURIComponent(query)}` : ''}`}
              aria-disabled={page === totalPages}
              className={`flex h-7 w-7 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:bg-surface-raised ${page === totalPages ? 'pointer-events-none opacity-30' : ''}`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
