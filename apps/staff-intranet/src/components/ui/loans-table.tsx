'use client';

import { useState } from 'react';
import { Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Loan {
  id: string;
  itemId: string;
  itemBarcode: string;
  itemTitle: string;
  patronId: string;
  patronName?: string;
  dueDate: string;
  status: string;
}

const PAGE_SIZE = 8;

export function LoansTable({ loans }: { loans: Loan[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(loans.length / PAGE_SIZE);
  const slice = loans.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle className="mb-2 h-8 w-8 text-accent-green/40" />
        <p className="font-mono text-xs text-text-muted">Sin préstamos activos</p>
      </div>
    );
  }

  return (
    <>
      <table className="data-table w-full">
        <thead>
          <tr>
            <th>Ejemplar</th>
            <th>Socio</th>
            <th>Vence</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((loan) => (
            <tr
              key={loan.id}
              className="table-row cursor-pointer hover:bg-surface-raised/60"
              onClick={() => router.push(`/patrons/${loan.patronId}`)}
              title={`Ver perfil de ${loan.patronName ?? loan.patronId}`}
            >
              <td className="max-w-[180px] truncate text-text-secondary text-xs">
                {loan.itemTitle || loan.itemBarcode || loan.itemId}
              </td>
              <td className="max-w-[160px] truncate text-text-secondary font-medium">
                {loan.patronName ?? loan.patronId}
              </td>
              <td className="font-mono text-xs text-text-muted">
                {new Date(loan.dueDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
              </td>
              <td>
                {loan.status === 'overdue' ? (
                  <span className="badge badge-red">
                    <Clock className="mr-1 h-2.5 w-2.5" />Vencido
                  </span>
                ) : (
                  <span className="badge badge-green">
                    <CheckCircle className="mr-1 h-2.5 w-2.5" />Activo
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
          <span className="font-mono text-xs text-text-muted">
            Página {page} de {totalPages} · {loans.length} préstamos
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:bg-surface-raised disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-7 w-7 items-center justify-center rounded-sm border font-mono text-xs transition-colors ${
                  p === page
                    ? 'border-accent-green bg-accent-green/10 text-accent-green'
                    : 'border-surface-border text-text-muted hover:bg-surface-raised'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-surface-border text-text-muted hover:bg-surface-raised disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
