'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ArrowLeft, Clock, CheckCircle, AlertTriangle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SkeletonLoanCard } from '@/components/ui/skeleton';

interface Prestamo {
  id: string;
  itemId: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  renewedCount: number;
  fineAmount: number;
  itemBarcode: string;
  itemTitle: string;
  coverImageUrl?: string | null;
}

const copFmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const estadoLabel: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:   { label: 'Activo',   color: 'text-emerald-library', icon: BookOpen     },
  overdue:  { label: 'Vencido',  color: 'text-rust',            icon: AlertTriangle },
  returned: { label: 'Devuelto', color: 'text-ink-muted',       icon: CheckCircle   },
  lost:     { label: 'Perdido',  color: 'text-rust',            icon: AlertTriangle },
};

export default function HistorialPage() {
  const router = useRouter();
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 6;

  useEffect(() => {
    const hasToken = document.cookie.split('; ').some(r => r.startsWith('bf_token='));
    if (!hasToken) { router.replace('/login?redirect=/dashboard/historial'); return; }
    cargarHistorial(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function cargarHistorial(p: number) {
    setCargando(true);
    try {
      const hasCookie = document.cookie.includes('bf_token=');
      const [res] = await Promise.all([
        hasCookie
          ? fetch(`/api/historial-prestamos?page=${p}&limit=${limit}`)
          : fetch('/api/prestamos-demo'),
        new Promise((r) => setTimeout(r, 500)),
      ]);
      if (res.ok) {
        const data = await res.json() as { data: Prestamo[]; total?: number };
        setPrestamos(data.data ?? []);
        setTotal(data.total ?? data.data?.length ?? 0);
      }
    } catch { /* ignorar */ } finally {
      setCargando(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-8 flex items-center gap-4">
            <Link href="/dashboard" className="text-ink-muted hover:text-ink">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <span className="section-label">Portal del socio</span>
              <h1 className="heading-md mt-1 text-ink">Historial de préstamos</h1>
            </div>
            <button
              onClick={() => { setRefrescando(true); cargarHistorial(page).finally(() => setRefrescando(false)); }}
              disabled={refrescando || cargando}
              className="btn-secondary disabled:opacity-50"
            >
              <RotateCcw className={`h-4 w-4 ${refrescando ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {cargando ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => <SkeletonLoanCard key={n} />)}
            </div>
          ) : prestamos.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-ink/20" />
              <p className="font-body text-sm text-ink-muted">No hay préstamos registrados</p>
              <Link href="/search" className="btn-secondary mt-4 px-4 py-2 text-sm">
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {prestamos.map((prestamo) => {
                const estado = estadoLabel[prestamo.status] ?? estadoLabel['returned']!;
                const Icon = estado.icon;
                return (
                  <div key={prestamo.id} className="card flex items-center gap-4 p-4">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-sm bg-parchment-dark flex items-center justify-center">
                      {prestamo.coverImageUrl
                        ? <img src={prestamo.coverImageUrl} alt={prestamo.itemTitle} className="h-full w-full object-cover" />
                        : <BookOpen className="h-5 w-5 text-ink/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-body text-sm font-medium text-ink">
                        {prestamo.itemTitle || prestamo.itemBarcode || prestamo.itemId}
                      </p>
                      <p className="font-mono text-xs text-ink-muted mt-0.5">
                        {prestamo.itemBarcode || prestamo.itemId}
                      </p>
                      <p className="font-mono text-xs text-ink-muted">
                        Préstamo: {new Date(prestamo.loanDate).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`flex items-center gap-1 justify-end ${estado.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs font-medium">{estado.label}</span>
                      </div>
                      {prestamo.returnDate ? (
                        <p className="font-mono text-xs text-ink-muted mt-0.5">
                          Dev: {new Date(prestamo.returnDate).toLocaleDateString('es-CO')}
                        </p>
                      ) : (
                        <p className="font-mono text-xs text-ink-muted mt-0.5">
                          Vence: {new Date(prestamo.dueDate).toLocaleDateString('es-CO')}
                        </p>
                      )}
                      {prestamo.fineAmount > 0 && (
                        <span className="font-mono text-sm font-bold text-rust mt-0.5 block">
                          {copFmt(prestamo.fineAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="font-mono text-xs text-ink-muted">
                Página {page} de {totalPages} · {total} préstamos
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border border-ink/15 text-ink-muted hover:bg-parchment-dark disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-7 w-7 items-center justify-center rounded-sm border font-mono text-xs transition-colors ${
                      p === page
                        ? 'border-amber-book/40 bg-amber-book/10 text-amber-book'
                        : 'border-ink/15 text-ink-muted hover:bg-parchment-dark'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border border-ink/15 text-ink-muted hover:bg-parchment-dark disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
