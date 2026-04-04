'use client';

import { useState } from 'react';
import { BookOpen, RefreshCw, Scan, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';

type LoanForm = { itemBarcode: string; patronCardNumber: string };
type ReturnForm = { itemBarcode: string };

export default function CirculationPage() {
  const [activeTab, setActiveTab] = useState<'loan' | 'return'>('loan');
  const [loanResult, setLoanResult] = useState<'success' | 'error' | null>(null);
  const [returnResult, setReturnResult] = useState<{ success: boolean; fine?: number } | null>(null);

  const loanForm = useForm<LoanForm>();
  const returnForm = useForm<ReturnForm>();

  const handleLoan = async (data: LoanForm) => {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setLoanResult('success');
    loanForm.reset();
  };

  const handleReturn = async (data: ReturnForm) => {
    await new Promise((r) => setTimeout(r, 800));
    setReturnResult({ success: true, fine: 0.5 });
    returnForm.reset();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Circulación</h1>
        <p className="font-mono text-xs text-text-muted">Préstamos y devoluciones</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-sm border border-surface-border bg-surface-card p-1 w-fit">
        {(['loan', 'return'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 rounded-sm px-4 py-2 font-body text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-surface-raised text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab === 'loan' ? (
              <><BookOpen className="h-4 w-4" /> Préstamo</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Devolución</>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form panel */}
        <div className="surface-card p-6">
          {activeTab === 'loan' ? (
            <form onSubmit={loanForm.handleSubmit(handleLoan)} className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-muted">
                  <Scan className="h-3 w-3" />
                  Código de barras del ejemplar
                </label>
                <input
                  {...loanForm.register('itemBarcode', { required: true })}
                  className="input-dark"
                  placeholder="Escanear o escribir código..."
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-muted">
                  <Scan className="h-3 w-3" />
                  Carnet del socio
                </label>
                <input
                  {...loanForm.register('patronCardNumber', { required: true })}
                  className="input-dark"
                  placeholder="Nº de carnet del socio..."
                />
              </div>

              <button
                type="submit"
                disabled={loanForm.formState.isSubmitting}
                className="btn-green w-full justify-center"
              >
                {loanForm.formState.isSubmitting ? 'Procesando...' : 'Registrar préstamo'}
              </button>
            </form>
          ) : (
            <form onSubmit={returnForm.handleSubmit(handleReturn)} className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-muted">
                  <Scan className="h-3 w-3" />
                  Código de barras del ejemplar
                </label>
                <input
                  {...returnForm.register('itemBarcode', { required: true })}
                  className="input-dark"
                  placeholder="Escanear o escribir código..."
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={returnForm.formState.isSubmitting}
                className="btn-green w-full justify-center"
              >
                {returnForm.formState.isSubmitting ? 'Procesando...' : 'Registrar devolución'}
              </button>
            </form>
          )}
        </div>

        {/* Result panel */}
        <div className="surface-card p-6">
          <h3 className="mb-4 font-display text-sm font-semibold text-text-primary">Resultado</h3>

          {activeTab === 'loan' && loanResult ? (
            loanResult === 'success' ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/15">
                  <CheckCircle className="h-8 w-8 text-accent-green" />
                </div>
                <p className="font-display text-base font-semibold text-text-primary">¡Préstamo registrado!</p>
                <p className="mt-1 font-mono text-xs text-text-muted">Fecha de devolución: 25 abr. 2026</p>
                <button
                  onClick={() => setLoanResult(null)}
                  className="btn-ghost mt-6 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Nuevo préstamo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-red/15">
                  <XCircle className="h-8 w-8 text-accent-red" />
                </div>
                <p className="font-display text-base font-semibold text-text-primary">Error al procesar</p>
              </div>
            )
          ) : activeTab === 'return' && returnResult ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/15">
                <CheckCircle className="h-8 w-8 text-accent-green" />
              </div>
              <p className="font-display text-base font-semibold text-text-primary">¡Devolución registrada!</p>
              {returnResult.fine && returnResult.fine > 0 ? (
                <div className="mt-3 rounded-sm border border-accent-amber/20 bg-accent-amber/8 px-4 py-2">
                  <p className="font-mono text-sm text-accent-amber">
                    Multa generada: <strong>€{returnResult.fine.toFixed(2)}</strong>
                  </p>
                </div>
              ) : (
                <p className="mt-1 font-mono text-xs text-text-muted">Sin multas. Devolución en plazo.</p>
              )}
              <button
                onClick={() => setReturnResult(null)}
                className="btn-ghost mt-6 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Nueva devolución
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <Scan className="mb-3 h-10 w-10 text-text-muted/30" />
              <p className="font-mono text-xs text-text-muted">
                Escanea un ejemplar para comenzar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
