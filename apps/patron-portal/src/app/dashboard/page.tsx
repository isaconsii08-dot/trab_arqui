'use client';

import { useEffect, useState } from 'react';
import { Clock, BookOpen, AlertTriangle, RefreshCw, CreditCard, X, CheckCircle } from 'lucide-react';
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

function diasHasta(fechaStr: string): number {
  const hoy = new Date();
  const fecha = new Date(fechaStr);
  return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function Toast({ msg, tipo, onClose }: { msg: string; tipo: 'ok' | 'err'; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-sm border px-5 py-3 shadow-lg font-body text-sm ${tipo === 'ok' ? 'border-emerald-library/30 bg-emerald-library/10 text-emerald-library' : 'border-rust/30 bg-rust/5 text-rust'}`}>
      {tipo === 'ok' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export default function DashboardPage() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [usuario, setUsuario] = useState<{ sub: string; role: string; fullName: string } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);
  const [renovando, setRenovando] = useState<string | null>(null);
  const [modalPago, setModalPago] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [cardNum, setCardNum] = useState('');

  const mostrarToast = (msg: string, tipo: 'ok' | 'err') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const userCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_user='));
    if (userCookie) {
      try {
        const decoded = JSON.parse(decodeURIComponent(userCookie.split('=').slice(1).join('='))) as { sub: string; role: string; fullName: string };
        setUsuario(decoded);
      } catch { /* cookie malformada */ }
    }

    // Llamada única al API route server-side que lee las cookies y busca préstamos
    fetch('/api/mis-prestamos')
      .then((r) => r.json())
      .then((data: { data: Prestamo[] }) => {
        const todos = data.data ?? [];
        if (todos.length > 0) {
          setPrestamos(todos.filter((l) => l.status === 'active' || l.status === 'overdue'));
        } else {
          // Sin sesión o sin préstamos reales: mostrar demo
          return fetch('/api/prestamos-demo')
            .then((r) => r.json())
            .then((d: { data: Prestamo[] }) => setPrestamos(d.data ?? []));
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  async function renovarPrestamo(prestamoId: string) {
    setRenovando(prestamoId);
    // Simulación: extender fecha en 14 días visualmente
    await new Promise((r) => setTimeout(r, 800));
    setPrestamos((prev) =>
      prev.map((p) => {
        if (p.id !== prestamoId) return p;
        const nuevaFecha = new Date(p.dueDate);
        nuevaFecha.setDate(nuevaFecha.getDate() + 14);
        return { ...p, dueDate: nuevaFecha.toISOString(), renewedCount: p.renewedCount + 1, status: 'active' };
      }),
    );
    setRenovando(null);
    mostrarToast('Préstamo renovado por 14 días adicionales', 'ok');
  }

  async function pagarMulta() {
    if (cardNum.replace(/\s/g, '').length < 16) {
      mostrarToast('Número de tarjeta inválido', 'err');
      return;
    }
    setPagando(true);
    await new Promise((r) => setTimeout(r, 1500)); // simular proceso de pago
    setPrestamos((prev) => prev.map((p) => ({ ...p, fineAmount: 0 })));
    setModalPago(false);
    setCardNum('');
    setPagando(false);
    mostrarToast('Pago procesado correctamente. ¡Multas saldadas!', 'ok');
  }

  const formatCard = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const vencidos = prestamos.filter((p) => p.status === 'overdue');
  const activos = prestamos.filter((p) => p.status === 'active');
  const multaTotal = prestamos.reduce((s, p) => s + (p.fineAmount ?? 0), 0);
  const nombreSocio = usuario?.fullName ?? 'Santiago Gómez Vargas';

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-5xl px-6 py-10">

          <div className="mb-10">
            <span className="section-label">Portal del socio</span>
            <h1 className="heading-md mt-2 text-ink">Mi cuenta</h1>
            <p className="mt-1 font-body text-sm text-ink-muted">
              Bienvenido, <span className="font-medium text-ink">{nombreSocio}</span>
              {!usuario && <span className="ml-2 rounded-full bg-amber-book/10 px-2 py-0.5 font-mono text-xs text-amber-book">Vista de demo</span>}
            </p>
          </div>

          {/* Alerta vencidos */}
          {vencidos.length > 0 && (
            <div className="mb-8 flex items-start gap-3 rounded-sm border border-rust/30 bg-rust/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rust" />
              <div className="flex-1">
                <p className="font-body text-sm font-medium text-rust">
                  Tienes {vencidos.length} préstamo{vencidos.length > 1 ? 's' : ''} vencido{vencidos.length > 1 ? 's' : ''}
                </p>
                <p className="mt-0.5 font-body text-xs text-rust/70">
                  Devuelve los materiales cuanto antes.
                  {multaTotal > 0 && <> Multa acumulada: <strong>${multaTotal.toFixed(2)}</strong></>}
                </p>
              </div>
              {multaTotal > 0 && (
                <button
                  onClick={() => setModalPago(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-sm bg-rust px-3 py-1.5 font-mono text-xs text-white hover:bg-rust/90"
                >
                  <CreditCard className="h-3.5 w-3.5" /> Pagar multa
                </button>
              )}
            </div>
          )}

          {/* Estadísticas */}
          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Préstamos activos', value: activos.length,              icon: BookOpen,       color: 'text-emerald-library' },
              { label: 'Vencidos',          value: vencidos.length,             icon: Clock,          color: vencidos.length > 0 ? 'text-rust' : 'text-ink-muted' },
              { label: 'Multas pendientes', value: `$${multaTotal.toFixed(2)}`, icon: AlertTriangle,  color: multaTotal > 0 ? 'text-amber-book' : 'text-ink-muted' },
              { label: 'Total préstamos',   value: prestamos.length,            icon: BookOpen,       color: 'text-ink-muted' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card p-5">
                  <Icon className={`mb-3 h-5 w-5 ${stat.color}`} />
                  <div className="font-display text-2xl font-semibold text-ink">{stat.value}</div>
                  <div className="mt-1 font-body text-xs text-ink-muted">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Préstamos */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Préstamos activos</h2>
              <Link href="/dashboard/historial" className="font-mono text-xs text-amber-book hover:underline">
                Ver historial →
              </Link>
            </div>

            {cargando ? (
              <div className="space-y-3">
                {[1, 2].map((n) => <div key={n} className="card h-24 animate-pulse bg-parchment-dark" />)}
              </div>
            ) : prestamos.length === 0 ? (
              <div className="card flex flex-col items-center py-12 text-center">
                <BookOpen className="mb-3 h-8 w-8 text-ink/20" />
                <p className="font-body text-sm text-ink-muted">No tienes préstamos activos</p>
                <Link href="/search" className="btn-secondary mt-4 px-4 py-2 text-sm">Explorar catálogo</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {prestamos.map((prestamo) => {
                  const diasRestantes = diasHasta(prestamo.dueDate);
                  const esVencido = prestamo.status === 'overdue' || diasRestantes < 0;
                  const puedeRenovar = !esVencido && prestamo.renewedCount < 2;

                  return (
                    <div
                      key={prestamo.id}
                      className={`card flex items-center gap-4 p-4 ${esVencido ? 'border-rust/20 bg-rust/3' : ''}`}
                    >
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-sm bg-parchment-dark flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-ink/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-ink truncate">
                          {prestamo.itemTitle || prestamo.itemBarcode || prestamo.itemId}
                        </p>
                        <p className="font-mono text-xs text-ink-muted mt-0.5">
                          Código: {prestamo.itemBarcode || prestamo.itemId}
                        </p>
                        <p className="font-mono text-xs text-ink-muted">
                          Préstamo: {new Date(prestamo.loanDate).toLocaleDateString('es-CO')}
                        </p>
                        {prestamo.renewedCount > 0 && (
                          <p className="font-mono text-xs text-amber-book">Renovado {prestamo.renewedCount}x</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono text-xs font-medium ${esVencido ? 'text-rust' : 'text-ink-muted'}`}>
                          {esVencido
                            ? `Vencido hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) !== 1 ? 's' : ''}`
                            : `Vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`}
                        </p>
                        <p className="font-mono text-xs text-ink-muted mt-0.5">
                          {new Date(prestamo.dueDate).toLocaleDateString('es-CO')}
                        </p>
                        {prestamo.fineAmount > 0 && (
                          <p className="font-mono text-xs text-rust mt-1">
                            Multa: ${prestamo.fineAmount.toFixed(2)}
                          </p>
                        )}
                        {puedeRenovar && (
                          <button
                            onClick={() => renovarPrestamo(prestamo.id)}
                            disabled={renovando === prestamo.id}
                            className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-amber-book hover:underline disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${renovando === prestamo.id ? 'animate-spin' : ''}`} />
                            {renovando === prestamo.id ? 'Renovando...' : 'Renovar'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* CTA sin sesión */}
          {!usuario && (
            <section className="rounded-sm border border-amber-book/20 bg-amber-book/5 p-6 text-center">
              <p className="font-body text-sm text-ink">
                Inicia sesión para ver tus préstamos personalizados
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/login" className="btn-amber px-5 py-2 text-sm">Iniciar sesión</Link>
                <Link href="/register" className="btn-secondary px-5 py-2 text-sm">Registrarme</Link>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Modal de pago de multa */}
      {modalPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-sm border border-ink/10 bg-parchment p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Pagar multa</h2>
              <button onClick={() => setModalPago(false)} className="text-ink-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 font-body text-sm text-ink-muted">
              Total a pagar: <strong className="text-rust">${multaTotal.toFixed(2)}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-body text-xs font-medium text-ink">Número de tarjeta</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={cardNum}
                  onChange={(e) => setCardNum(formatCard(e.target.value))}
                  className="input-field"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-body text-xs font-medium text-ink">Vencimiento</label>
                  <input type="text" placeholder="MM/AA" className="input-field" maxLength={5} />
                </div>
                <div>
                  <label className="mb-1 block font-body text-xs font-medium text-ink">CVV</label>
                  <input type="text" placeholder="123" className="input-field" maxLength={3} />
                </div>
              </div>
            </div>

            <button
              onClick={pagarMulta}
              disabled={pagando}
              className="btn-amber mt-5 w-full justify-center"
            >
              {pagando ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Confirmar pago ${multaTotal.toFixed(2)}
                </span>
              )}
            </button>

            <p className="mt-3 text-center font-mono text-xs text-ink-muted">
              Procesado de forma segura · Solo para demostración
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </>
  );
}
