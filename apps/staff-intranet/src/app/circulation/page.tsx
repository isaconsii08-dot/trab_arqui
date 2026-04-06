'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, RefreshCw, Scan, CheckCircle, XCircle, ArrowLeft, Inbox, Clock, ThumbsUp, ThumbsDown, Package, User, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

type LoanForm = { itemBarcode: string; patronCardNumber: string };
type ReturnForm = { itemBarcode: string };

interface LoanResult {
  id?: string;
  dueDate?: string;
  message?: string;
}

interface ReturnResult {
  fineAmount?: number;
  message?: string;
}

interface Solicitud {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada';
  creadaEn: string;
  notas?: string;
}

interface PatronInfo {
  id: string;
  fullName: string;
  cardNumber: string;
  status: string;
  pendingFinesTotal: number;
}

interface ItemInfo {
  id: string;
  barcode: string;
  status: string;
  location: string;
  title?: string;
}

const copFmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const ESTADO_STYLES: Record<string, { label: string; cls: string }> = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-accent-amber/15 text-accent-amber border-accent-amber/20' },
  aprobada:   { label: 'Aprobada',   cls: 'bg-accent-green/15 text-accent-green border-accent-green/20' },
  rechazada:  { label: 'Rechazada',  cls: 'bg-accent-red/15 text-accent-red border-accent-red/20' },
  entregada:  { label: 'Entregada',  cls: 'bg-surface-raised text-text-muted border-surface-border' },
};

function useLookup<T>(type: 'patron' | 'item', query: string, delay = 400) {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (!q || q.length < 3) { setResults([]); return; }

    timerRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/circulacion/lookup?type=${type}&q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data: any) => {
          // Si el API devuelve un objeto con un campo 'data' (como el patron-service)
          if (data && data.data && Array.isArray(data.data)) {
            setResults(data.data);
          } else if (Array.isArray(data)) {
            setResults(data);
          } else if (data && typeof data === 'object') {
            // Un solo resultado
            setResults([data]);
          } else {
            setResults([]);
          }
        })
        .catch((err) => {
          console.error(`Lookup error for ${type}:`, err);
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, delay);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, type, delay]);

  return { results, loading };
}

export default function CirculationPage() {
  const [activeTab, setActiveTab] = useState<'loan' | 'return' | 'solicitudes'>('loan');
  const [loanOk, setLoanOk] = useState<LoanResult | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);
  const [returnOk, setReturnOk] = useState<ReturnResult | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [pendienteCount, setPendienteCount] = useState(0);
  const [prestamosActivos, setPrestamosActivos] = useState(0);

  const loanForm = useForm<LoanForm>();
  const returnForm = useForm<ReturnForm>();

  // Live lookup values
  const loanBarcode = loanForm.watch('itemBarcode') ?? '';
  const loanCarnet  = loanForm.watch('patronCardNumber') ?? '';
  const returnBarcode = returnForm.watch('itemBarcode') ?? '';

  const { results: loanItemResults, loading: loadingLoanItem }     = useLookup<ItemInfo>('item', loanBarcode);
  const { results: loanPatronResults, loading: loadingLoanPatron } = useLookup<PatronInfo>('patron', loanCarnet);
  const { results: returnItemResults, loading: loadingReturnItem } = useLookup<ItemInfo>('item', returnBarcode);

  // Seleccionados manualmente (para no mostrar el dropdown si ya se eligió uno)
  const [selectedLoanItem, setSelectedLoanItem] = useState<ItemInfo | null>(null);
  const [selectedLoanPatron, setSelectedLoanPatron] = useState<PatronInfo | null>(null);
  const [selectedReturnItem, setSelectedReturnItem] = useState<ItemInfo | null>(null);

  // Limpiar seleccionados al cambiar de pestaña o resetear
  useEffect(() => {
    if (!loanBarcode) setSelectedLoanItem(null);
  }, [loanBarcode]);
  useEffect(() => {
    if (!loanCarnet) setSelectedLoanPatron(null);
  }, [loanCarnet]);
  useEffect(() => {
    if (!returnBarcode) setSelectedReturnItem(null);
  }, [returnBarcode]);

  // Cargar estadísticas reales
  const cargarStats = useCallback(async () => {
    try {
      const res = await fetch('/api/circulacion/stats');
      if (res.ok) {
        const data = await res.json();
        setPrestamosActivos(data.prestamosActivos ?? 0);
      }
    } catch (err) {
      console.error('Error al cargar stats:', err);
    }
  }, []);

  const cargarSolicitudes = useCallback(() => {
    fetch('/api/prestamos')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setSolicitudes(arr);
        setPendienteCount(arr.filter((s: Solicitud) => s.estado === 'pendiente').length);
      })
      .catch(() => {
        setSolicitudes([]);
        setPendienteCount(0);
      });
  }, []);

  useEffect(() => {
    cargarSolicitudes();
    cargarStats();
    const interval = setInterval(() => {
      cargarSolicitudes();
      cargarStats();
    }, 8000);
    return () => clearInterval(interval);
  }, [cargarSolicitudes, cargarStats]);

  const cambiarEstado = async (id: string, estado: Solicitud['estado']) => {
    await fetch(`/api/prestamos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    cargarSolicitudes();
  };

  const handleLoan = async (data: LoanForm) => {
    setLoanOk(null);
    setLoanError(null);
    try {
      const res = await fetch('/api/circulacion/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json() as LoanResult;
      if (!res.ok) {
        setLoanError((body as { message?: string }).message ?? 'No se pudo registrar el préstamo');
      } else {
        setLoanOk(body);
        loanForm.reset();
      }
    } catch {
      setLoanError('No se pudo conectar con el servidor');
    }
  };

  const handleReturn = async (data: ReturnForm) => {
    setReturnOk(null);
    setReturnError(null);
    try {
      const res = await fetch('/api/circulacion/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json() as ReturnResult;
      if (!res.ok) {
        setReturnError((body as { message?: string }).message ?? 'No se pudo registrar la devolución');
      } else {
        setReturnOk(body);
        returnForm.reset();
      }
    } catch {
      setReturnError('No se pudo conectar con el servidor');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Circulación</h1>
        <p className="font-mono text-xs text-text-muted">Préstamos, devoluciones y solicitudes en línea</p>
      </div>

      {/* Selector de pestaña */}
      <div className="flex gap-1 rounded-sm border border-surface-border bg-surface-card p-1 w-fit">
        {([
          { key: 'loan',        icon: BookOpen,  label: 'Préstamo'    },
          { key: 'return',      icon: RefreshCw, label: 'Devolución'  },
          { key: 'solicitudes', icon: Inbox,     label: 'Solicitudes' },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 rounded-sm px-4 py-2 font-body text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-surface-raised text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.key === 'solicitudes' && pendienteCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-amber px-1 font-mono text-[10px] font-bold text-white">
                  {pendienteCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SOLICITUDES ── */}
      {activeTab === 'solicitudes' && (
        <div className="space-y-3">
          {solicitudes.length === 0 ? (
            <div className="surface-card flex flex-col items-center py-16 text-center">
              <Inbox className="mb-3 h-10 w-10 text-text-muted/20" />
              <p className="font-mono text-xs text-text-muted">No hay solicitudes registradas</p>
            </div>
          ) : (
            solicitudes.map((s) => {
              const est = ESTADO_STYLES[s.estado] ?? ESTADO_STYLES.pendiente;
              return (
                <div key={s.id} className="surface-card flex items-start gap-4 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised">
                    <BookOpen className="h-4 w-4 text-text-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-body text-sm font-medium text-text-primary line-clamp-1">{s.bookTitle}</p>
                        <p className="font-mono text-xs text-text-muted">
                          {s.userName} · {new Date(s.creadaEn).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-sm border px-2 py-0.5 font-mono text-xs ${est.cls}`}>
                        {est.label}
                      </span>
                    </div>
                    {s.estado === 'pendiente' && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => cambiarEstado(s.id, 'aprobada')}
                          className="flex items-center gap-1.5 rounded-sm border border-accent-green/30 px-3 py-1.5 font-mono text-xs text-accent-green hover:bg-accent-green/8 transition-colors"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" /> Aprobar
                        </button>
                        <button
                          onClick={() => cambiarEstado(s.id, 'rechazada')}
                          className="flex items-center gap-1.5 rounded-sm border border-accent-red/30 px-3 py-1.5 font-mono text-xs text-accent-red hover:bg-accent-red/8 transition-colors"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" /> Rechazar
                        </button>
                      </div>
                    )}
                    {s.estado === 'aprobada' && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => cambiarEstado(s.id, 'entregada')}
                          className="flex items-center gap-1.5 rounded-sm border border-surface-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:bg-surface-raised transition-colors"
                        >
                          <Package className="h-3.5 w-3.5" /> Marcar entregado
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── PRÉSTAMO / DEVOLUCIÓN ── */}
      {activeTab !== 'solicitudes' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Panel de formulario */}
          <div className="surface-card p-6">
            {activeTab === 'loan' ? (
              <form onSubmit={loanForm.handleSubmit(handleLoan)} className="space-y-4">
                {/* Campo: código de barras del ejemplar */}
                <div className="relative">
                  <label className="mb-1.5 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-muted">
                    <Scan className="h-3 w-3" />
                    Ejemplar (Barcode o Título)
                  </label>
                  <input
                    {...loanForm.register('itemBarcode', { required: true })}
                    className="input-dark"
                    placeholder="Buscar por título o escanear..."
                    autoFocus
                    autoComplete="off"
                  />
                  
                  {/* Sugerencias de ejemplares */}
                  {!selectedLoanItem && loanItemResults.length > 0 && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-sm border border-surface-border bg-surface-card shadow-lg">
                      {loanItemResults.map((item) => (
                        <button
                          key={item.barcode}
                          type="button"
                          onClick={() => {
                            loanForm.setValue('itemBarcode', item.barcode);
                            setSelectedLoanItem(item);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-surface-raised"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-body text-xs font-medium text-text-primary">{item.title || 'Sin título'}</p>
                            <p className="font-mono text-[10px] text-text-muted">{item.barcode} · {item.location}</p>
                          </div>
                          <span className={`font-mono text-[10px] ${item.status === 'available' ? 'text-accent-green' : 'text-accent-amber'}`}>
                            {item.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Live item preview (seleccionado o único) */}
                  {(selectedLoanItem || (loanItemResults.length === 1 && loanBarcode === loanItemResults[0].barcode)) && (
                    <div className="mt-1.5 rounded-sm border border-accent-amber/20 bg-accent-amber/5 px-3 py-2">
                      {(() => {
                        const item = selectedLoanItem || loanItemResults[0];
                        return (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-body text-xs font-medium text-text-primary truncate max-w-[200px]">
                                {item.title ?? item.barcode}
                              </p>
                              <p className="font-mono text-xs text-text-muted">{item.location}</p>
                            </div>
                            <span className={`font-mono text-xs ${item.status === 'available' ? 'text-accent-green' : 'text-accent-amber'}`}>
                              {item.status === 'available' ? 'Disponible' : item.status}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Campo: carnet del socio */}
                <div className="relative">
                  <label className="mb-1.5 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-muted">
                    <User className="h-3 w-3" />
                    Socio (Carnet o Nombre)
                  </label>
                  <input
                    {...loanForm.register('patronCardNumber', { required: true })}
                    className="input-dark"
                    placeholder="Buscar por nombre o carnet..."
                    autoComplete="off"
                  />

                  {/* Sugerencias de socios */}
                  {!selectedLoanPatron && loanPatronResults.length > 0 && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-sm border border-surface-border bg-surface-card shadow-lg">
                      {loanPatronResults.map((patron) => (
                        <button
                          key={patron.id}
                          type="button"
                          onClick={() => {
                            loanForm.setValue('patronCardNumber', patron.cardNumber);
                            setSelectedLoanPatron(patron);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-surface-raised"
                        >
                          <div>
                            <p className="font-body text-xs font-medium text-text-primary">{patron.fullName}</p>
                            <p className="font-mono text-[10px] text-text-muted">{patron.cardNumber}</p>
                          </div>
                          <span className={`font-mono text-[10px] ${patron.status === 'active' ? 'text-accent-green' : 'text-accent-red'}`}>
                            {patron.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Live patron preview (seleccionado o único) */}
                  {(selectedLoanPatron || (loanPatronResults.length === 1 && loanCarnet === loanPatronResults[0].cardNumber)) && (
                    <div className="mt-1.5 rounded-sm border border-accent-amber/20 bg-accent-amber/5 px-3 py-2">
                      {(() => {
                        const patron = selectedLoanPatron || loanPatronResults[0];
                        return (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-body text-xs font-medium text-text-primary">{patron.fullName}</p>
                              <p className="font-mono text-xs text-text-muted">{patron.cardNumber}</p>
                            </div>
                            <span className={`font-mono text-xs ${patron.status === 'active' ? 'text-accent-green' : 'text-accent-red'}`}>
                              {patron.status}
                              {patron.pendingFinesTotal > 0 && <> · {copFmt(patron.pendingFinesTotal)}</>}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {loanError && (
                  <p className="rounded-sm border border-accent-red/20 bg-accent-red/8 px-3 py-2 font-mono text-xs text-accent-red">
                    {loanError}
                  </p>
                )}

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
                <div className="relative">
                  <label className="mb-1.5 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-muted">
                    <Scan className="h-3 w-3" />
                    Ejemplar (Barcode o Título)
                  </label>
                  <input
                    {...returnForm.register('itemBarcode', { required: true })}
                    className="input-dark"
                    placeholder="Buscar por título o escanear..."
                    autoFocus
                    autoComplete="off"
                  />
                  
                  {/* Sugerencias de ejemplares para devolución */}
                  {!selectedReturnItem && returnItemResults.length > 0 && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-sm border border-surface-border bg-surface-card shadow-lg">
                      {returnItemResults.map((item) => (
                        <button
                          key={item.barcode}
                          type="button"
                          onClick={() => {
                            returnForm.setValue('itemBarcode', item.barcode);
                            setSelectedReturnItem(item);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-surface-raised"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-body text-xs font-medium text-text-primary">{item.title || 'Sin título'}</p>
                            <p className="font-mono text-[10px] text-text-muted">{item.barcode} · {item.location}</p>
                          </div>
                          <span className={`font-mono text-[10px] ${item.status === 'loaned' ? 'text-accent-amber' : 'text-text-muted'}`}>
                            {item.status === 'loaned' ? 'En préstamo' : item.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Live item preview para devolución */}
                  {(selectedReturnItem || (returnItemResults.length === 1 && returnBarcode === returnItemResults[0].barcode)) && (
                    <div className="mt-1.5 rounded-sm border border-surface-border bg-surface-raised/60 px-3 py-2">
                      {(() => {
                        const item = selectedReturnItem || returnItemResults[0];
                        return (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-body text-xs font-medium text-text-primary truncate max-w-[200px]">
                                {item.title ?? item.barcode}
                              </p>
                              <p className="font-mono text-xs text-text-muted">{item.location}</p>
                            </div>
                            <span className={`font-mono text-xs ${item.status === 'loaned' ? 'text-accent-amber' : 'text-text-muted'}`}>
                              {item.status === 'loaned' ? 'En préstamo' : item.status === 'available' ? 'Ya disponible' : item.status}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {returnError && (
                  <p className="rounded-sm border border-accent-red/20 bg-accent-red/8 px-3 py-2 font-mono text-xs text-accent-red">
                    {returnError}
                  </p>
                )}

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

          {/* Panel de resultado */}
          <div className="surface-card p-6">
            <h3 className="mb-4 font-display text-sm font-semibold text-text-primary">Resultado</h3>

            {activeTab === 'loan' && loanOk ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/15">
                  <CheckCircle className="h-8 w-8 text-accent-green" />
                </div>
                <p className="font-display text-base font-semibold text-text-primary">¡Préstamo registrado!</p>
                {loanOk.dueDate && (
                  <p className="mt-1 font-mono text-xs text-text-muted">
                    Fecha de devolución: {new Date(loanOk.dueDate).toLocaleDateString('es-CO')}
                  </p>
                )}
                <button
                  onClick={() => { setLoanOk(null); setLoanError(null); }}
                  className="btn-ghost mt-6 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Nuevo préstamo
                </button>
              </div>
            ) : activeTab === 'loan' && loanError ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-red/15">
                  <XCircle className="h-8 w-8 text-accent-red" />
                </div>
                <p className="font-display text-base font-semibold text-text-primary">Error al procesar</p>
                <p className="mt-1 font-mono text-xs text-text-muted">{loanError}</p>
                <button
                  onClick={() => { setLoanOk(null); setLoanError(null); }}
                  className="btn-ghost mt-6 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Intentar de nuevo
                </button>
              </div>
            ) : activeTab === 'return' && returnOk ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/15">
                  <CheckCircle className="h-8 w-8 text-accent-green" />
                </div>
                <p className="font-display text-base font-semibold text-text-primary">¡Devolución registrada!</p>
                {returnOk.fineAmount && returnOk.fineAmount > 0 ? (
                  <div className="mt-3 rounded-sm border border-accent-amber/20 bg-accent-amber/8 px-4 py-2">
                    <p className="font-mono text-sm text-accent-amber">
                      Multa generada: <strong>{copFmt(returnOk.fineAmount)}</strong>
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 font-mono text-xs text-text-muted">Sin multas. Devolución en plazo.</p>
                )}
                <button
                  onClick={() => { setReturnOk(null); setReturnError(null); }}
                  className="btn-ghost mt-6 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Nueva devolución
                </button>
              </div>
            ) : activeTab === 'return' && returnError ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-red/15">
                  <XCircle className="h-8 w-8 text-accent-red" />
                </div>
                <p className="font-display text-base font-semibold text-text-primary">Error al procesar</p>
                <p className="mt-1 font-mono text-xs text-text-muted">{returnError}</p>
                <button
                  onClick={() => { setReturnOk(null); setReturnError(null); }}
                  className="btn-ghost mt-6 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Intentar de nuevo
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
      )}

      {/* Indicador de reloj en solicitudes */}
      {activeTab === 'solicitudes' && solicitudes.length > 0 && (
        <p className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
          <Clock className="h-3 w-3" /> Actualización automática cada 8 s
        </p>
      )}
    </div>
  );
}
