import { ArrowLeft, User, AlertTriangle, CheckCircle, Clock, BookOpen, Pencil, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshButton } from '@/components/ui/refresh-button';
import { notFound } from 'next/navigation';
import { obtenerTokenServicio } from '@/lib/api';

const PATRON_URL   = process.env.PATRON_SERVICE_URL   ?? 'http://localhost:3001';
const CIRC_URL     = process.env.CIRC_SERVICE_URL     ?? 'http://localhost:3004';
const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://localhost:3003';
const CATALOG_URL  = process.env.CATALOG_SERVICE_URL  ?? 'http://localhost:3002';

interface PatronDto {
  id: string;
  cardNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: string;
  registrationDate: string;
  pendingFinesTotal: number;
  libraryId: string;
}

interface LoanDto {
  id: string;
  itemId: string;
  itemBarcode: string;
  itemTitle: string;
  coverImageUrl?: string | null;
  itemAuthors?: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  fineAmount: number;
}

async function obtenerSocio(id: string, token: string): Promise<PatronDto | null> {
  const res = await fetch(`${PATRON_URL}/api/v1/patrons/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json() as Promise<PatronDto>;
}

async function obtenerPrestamosDelSocio(
  patronId: string, token: string, page = 1, limit = 10,
): Promise<{ loans: LoanDto[]; total: number }> {
  const res = await fetch(
    `${CIRC_URL}/api/v1/circulation/loans/patron/${patronId}?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  );
  if (!res.ok) return { loans: [], total: 0 };
  const data = await res.json() as { data?: LoanDto[]; total?: number };
  const loans = data.data ?? [];
  const total = data.total ?? loans.length;
  if (loans.length === 0) return { loans: [], total: 0 };

  // Enriquecer: barcode → holdings → recordId → catálogo (título + portada)
  const holdingsMap: Record<string, string> = {}; // barcode → recordId
  await Promise.all(
    loans.map((l) =>
      fetch(`${HOLDINGS_URL}/api/v1/holdings/items/${l.itemBarcode}`, { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .then((item: { barcode: string; recordId: string } | null) => {
          if (item?.recordId) holdingsMap[item.barcode] = item.recordId;
        })
        .catch(() => {}),
    ),
  );

  const uniqueIds = [...new Set(Object.values(holdingsMap))];
  const catalogMap: Record<string, { title: string; coverImageUrl: string | null; authors: string }> = {};
  await Promise.all(
    uniqueIds.map((id) =>
      fetch(`${CATALOG_URL}/api/v1/catalog/${id}`, { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .then((d: { title?: string; coverImageUrl?: string | null; authors?: Array<{ name: string }> } | null) => {
          if (d) catalogMap[id] = {
            title: d.title ?? '',
            coverImageUrl: d.coverImageUrl ?? null,
            authors: d.authors?.map((a) => a.name).join(', ') ?? '',
          };
        })
        .catch(() => {}),
    ),
  );

  const enriched = loans.map((l) => {
    const recordId = holdingsMap[l.itemBarcode];
    const cat = recordId ? catalogMap[recordId] : null;
    return {
      ...l,
      itemTitle: cat?.title || l.itemTitle || l.itemBarcode,
      coverImageUrl: cat?.coverImageUrl ?? null,
      itemAuthors: cat?.authors ?? '',
    };
  });
  return { loans: enriched, total };
}

const copFmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const estadoBadge: Record<string, string> = {
  active:    'badge-green',
  suspended: 'badge-red',
  expired:   'badge-amber',
  blocked:   'badge-red',
};

const estadoLoan: Record<string, { label: string; badge: string }> = {
  active:   { label: 'Activo',   badge: 'badge-green' },
  overdue:  { label: 'Vencido',  badge: 'badge-red'   },
  returned: { label: 'Devuelto', badge: 'badge-blue'  },
  lost:     { label: 'Perdido',  badge: 'badge-red'   },
};

export default async function PatronDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const page = Math.max(1, parseInt((await searchParams).page ?? '1', 10));
  const limit = 6;
  const token = await obtenerTokenServicio();
  const [socio, { loans: prestamos, total }] = await Promise.all([
    obtenerSocio(id, token),
    obtenerPrestamosDelSocio(id, token, page, limit),
  ]);

  if (!socio) notFound();

  const totalPages = Math.ceil(total / limit);
  const activos  = prestamos.filter((p) => p.status === 'active').length;
  const vencidos = prestamos.filter((p) => p.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link href="/patrons" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">{socio.fullName}</h1>
          <p className="font-mono text-xs text-text-muted">{socio.cardNumber}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <RefreshButton />
          <Link href={`/patrons/${id}/edit`} className="btn-ghost text-sm">
            <Pencil className="h-4 w-4" /> Editar
          </Link>
        </div>
        <span className={`badge ${estadoBadge[socio.status] ?? ''}`}>
          {socio.status === 'active'    && <><CheckCircle className="mr-1 h-3 w-3" />Activo</>}
          {socio.status === 'suspended' && <><AlertTriangle className="mr-1 h-3 w-3" />Suspendido</>}
          {socio.status === 'expired'   && <><Clock className="mr-1 h-3 w-3" />Caducado</>}
          {socio.status === 'blocked'   && <><Ban className="mr-1 h-3 w-3" />Bloqueado</>}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Datos del socio */}
        <div className="space-y-4">
          <div className="surface-card p-5">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised">
              <User className="h-8 w-8 text-text-muted" />
            </div>
            <div className="space-y-3">
              {[
                { label: 'Email',        value: socio.email },
                { label: 'Teléfono',     value: socio.phone ?? '—' },
                { label: 'Dirección',    value: socio.address ?? '—' },
                { label: 'Registro',     value: new Date(socio.registrationDate).toLocaleDateString('es-CO') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-mono text-xs text-text-muted">{label}</p>
                  <p className="font-body text-sm text-text-primary">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: String(activos), label: 'Activos', alert: false },
              { value: String(vencidos), label: 'Vencidos', alert: vencidos > 0 },
              { value: copFmt(socio.pendingFinesTotal ?? 0), label: 'Multas', alert: (socio.pendingFinesTotal ?? 0) > 0 },
            ].map(({ value, label, alert }) => (
              <div key={label} className="surface-card flex flex-col items-center justify-center gap-1 p-5 text-center">
                <p className={`font-mono text-xl font-bold leading-none ${alert ? 'text-accent-red' : 'text-text-primary'}`}>
                  {value}
                </p>
                <p className="font-mono text-xs text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Historial de préstamos */}
        <div className="lg:col-span-2 surface-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
            <BookOpen className="h-4 w-4 text-text-muted" />
            <h2 className="font-display text-sm font-semibold text-text-primary">
              Préstamos ({total})
            </h2>
          </div>

          {prestamos.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <BookOpen className="mb-2 h-8 w-8 text-text-muted/20" />
              <p className="font-mono text-xs text-text-muted">Sin préstamos registrados</p>
            </div>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Préstamo</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Multa</th>
                </tr>
              </thead>
              <tbody>
                {prestamos.map((p) => {
                  const est = estadoLoan[p.status] ?? { label: p.status, badge: '' };
                  return (
                    <tr key={p.id} className="table-row">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-sm bg-surface-raised">
                            {p.coverImageUrl ? (
                              <Image
                                src={p.coverImageUrl}
                                alt={p.itemTitle}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            ) : (
                              <BookOpen className="absolute inset-0 m-auto h-4 w-4 text-text-muted/40" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-body text-sm font-medium text-text-primary max-w-[180px]">
                              {p.itemTitle}
                            </p>
                            {p.itemAuthors && (
                              <p className="truncate font-mono text-xs text-text-muted max-w-[180px]">
                                {p.itemAuthors}
                              </p>
                            )}
                            <p className="font-mono text-[10px] text-text-muted">{p.itemBarcode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-text-muted">
                        {new Date(p.loanDate).toLocaleDateString('es-CO')}
                      </td>
                      <td className="font-mono text-xs text-text-muted">
                        {new Date(p.dueDate).toLocaleDateString('es-CO')}
                      </td>
                      <td>
                        <span className={`badge ${est.badge}`}>{est.label}</span>
                      </td>
                      <td>
                        {p.fineAmount > 0 ? (
                          <span className="font-mono text-sm font-bold text-accent-red">{copFmt(p.fineAmount)}</span>
                        ) : (
                          <span className="font-mono text-sm text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
              <span className="font-mono text-xs text-text-muted">
                Página {page} de {totalPages} · {total} préstamos
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href={`/patrons/${id}?page=${page - 1}`}
                  aria-disabled={page === 1}
                  className={`flex h-7 w-7 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:bg-surface-raised ${page === 1 ? 'pointer-events-none opacity-30' : ''}`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/patrons/${id}?page=${p}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-sm border font-mono text-xs transition-colors ${
                      p === page
                        ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                        : 'border-surface-border text-text-muted hover:bg-surface-raised'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  href={`/patrons/${id}?page=${page + 1}`}
                  aria-disabled={page === totalPages}
                  className={`flex h-7 w-7 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:bg-surface-raised ${page === totalPages ? 'pointer-events-none opacity-30' : ''}`}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
