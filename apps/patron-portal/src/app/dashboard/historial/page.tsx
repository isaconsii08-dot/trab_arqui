'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ArrowLeft, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Link from 'next/link';

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
}

const estadoLabel: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:   { label: 'Activo',    color: 'text-emerald-library', icon: BookOpen },
  overdue:  { label: 'Vencido',   color: 'text-rust',            icon: AlertTriangle },
  returned: { label: 'Devuelto',  color: 'text-ink-muted',       icon: CheckCircle },
  lost:     { label: 'Perdido',   color: 'text-rust',            icon: AlertTriangle },
};

export default function HistorialPage() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    cargarHistorial(page);
  }, [page]);

  async function cargarHistorial(p: number) {
    setCargando(true);
    try {
      // Leer sesión desde cookies
      const tokenCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_token='));
      const userCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_user='));

      if (!tokenCookie || !userCookie) {
        // Sin sesión: mostrar historial del socio de demo
        const res = await fetch('/api/prestamos-demo');
        if (res.ok) {
          const data = await res.json() as { data: Prestamo[] };
          setPrestamos(data.data ?? []);
          setTotal(data.data?.length ?? 0);
        }
        return;
      }

      const token = decodeURIComponent(tokenCookie.split('=').slice(1).join('='));
      const user = JSON.parse(decodeURIComponent(userCookie.split('=')[1] ?? '')) as { sub: string };

      const res = await fetch(
        `http://localhost:3004/api/v1/circulation/loans/patron/${user.sub}?page=${p}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.ok) {
        const data = await res.json() as { data: Prestamo[]; total: number };
        setPrestamos(data.data ?? []);
        setTotal(data.total ?? 0);
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
            <div>
              <span className="section-label">Portal del socio</span>
              <h1 className="heading-md mt-1 text-ink">Historial de préstamos</h1>
            </div>
          </div>

          {cargando ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card h-20 animate-pulse bg-parchment-dark" />
              ))}
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
                const estado = estadoLabel[prestamo.status] ?? estadoLabel['returned'];
                const Icon = estado.icon;
                return (
                  <div key={prestamo.id} className="card flex items-center gap-4 p-4">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-sm bg-parchment-dark">
                      <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-ink/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-body text-sm font-medium text-ink">
                        {prestamo.itemTitle || prestamo.itemBarcode || prestamo.itemId}
                      </p>
                      <p className="font-mono text-xs text-ink-muted mt-0.5">
                        {prestamo.itemBarcode || prestamo.itemId}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`flex items-center gap-1 justify-end ${estado.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs font-medium">{estado.label}</span>
                      </div>
                      <p className="font-mono text-xs text-ink-muted mt-0.5">
                        {new Date(prestamo.loanDate).toLocaleDateString('es-CO')}
                      </p>
                      {prestamo.returnDate && (
                        <p className="font-mono text-xs text-ink-muted">
                          Dev: {new Date(prestamo.returnDate).toLocaleDateString('es-CO')}
                        </p>
                      )}
                      {prestamo.fineAmount > 0 && (
                        <p className="font-mono text-xs text-rust mt-0.5">
                          Multa: ${prestamo.fineAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="font-mono text-xs text-ink-muted">
                Página {page} de {totalPages} · {total} préstamos
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    ← Anterior
                  </button>
                )}
                {page < totalPages && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    Siguiente →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
