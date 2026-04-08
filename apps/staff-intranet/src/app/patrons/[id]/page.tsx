import { ArrowLeft, User, AlertTriangle, CheckCircle, Clock, BookOpen, Pencil, Ban } from 'lucide-react';
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

async function obtenerPrestamosDelSocio(patronId: string, token: string): Promise<LoanDto[]> {
  const res = await fetch(
    `${CIRC_URL}/api/v1/circulation/loans/patron/${patronId}?page=1&limit=20`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  );
  if (!res.ok) return [];
  const data = await res.json() as { data?: LoanDto[] };
  const loans = data.data ?? [];
  if (loans.length === 0) return loans;

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

  return loans.map((l) => {
    const recordId = holdingsMap[l.itemBarcode];
    const cat = recordId ? catalogMap[recordId] : null;
    return {
      ...l,
      itemTitle: cat?.title || l.itemTitle || l.itemBarcode,
      coverImageUrl: cat?.coverImageUrl ?? null,
      itemAuthors: cat?.authors ?? '',
    };
  });
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

export default async function PatronDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await obtenerTokenServicio();
  const [socio, prestamos] = await Promise.all([
    obtenerSocio(id, token),
    obtenerPrestamosDelSocio(id, token),
  ]);

  if (!socio) notFound();

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
            <div className="surface-card p-3 text-center">
              <p className="font-display text-xl font-semibold text-text-primary">{activos}</p>
              <p className="font-mono text-xs text-text-muted">Activos</p>
            </div>
            <div className="surface-card p-3 text-center">
              <p className={`font-display text-xl font-semibold ${vencidos > 0 ? 'text-accent-red' : 'text-text-primary'}`}>
                {vencidos}
              </p>
              <p className="font-mono text-xs text-text-muted">Vencidos</p>
            </div>
            <div className="surface-card p-3 text-center">
              <p className={`font-display text-xl font-semibold ${socio.pendingFinesTotal > 0 ? 'text-accent-red' : 'text-text-primary'}`}>
                {copFmt(socio.pendingFinesTotal ?? 0)}
              </p>
              <p className="font-mono text-xs text-text-muted">Multas</p>
            </div>
          </div>
        </div>

        {/* Historial de préstamos */}
        <div className="lg:col-span-2 surface-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
            <BookOpen className="h-4 w-4 text-text-muted" />
            <h2 className="font-display text-sm font-semibold text-text-primary">
              Préstamos ({prestamos.length})
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
                      <td className={`font-mono text-sm font-medium ${p.fineAmount > 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                        {p.fineAmount > 0 ? copFmt(p.fineAmount) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
