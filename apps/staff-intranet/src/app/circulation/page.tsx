'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, RefreshCw, Scan, CheckCircle, XCircle, ArrowLeft, Inbox, Clock, ThumbsUp, ThumbsDown, Package, User, Loader2, Library, AlertTriangle, Search, RotateCcw, Pencil, Trash2, BadgeDollarSign, ShieldOff, CreditCard, CalendarDays, X } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { DatePicker } from '@/components/ui/date-picker';

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
  cardNumber?: string;
  itemBarcode?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada';
  creadaEn: string;
  notas?: string;
}

interface PrestamoActivo {
  id: string;
  itemBarcode: string;
  itemTitle: string;
  itemAuthors: string;
  itemLocation: string;
  coverImageUrl: string | null;
  patronId: string;
  patronName: string;
  patronCardNumber: string;
  patronStatus: string;
  loanDate: string;
  dueDate: string;
  status: string;
  renewedCount: number;
  fineAmount: number;
  recordId?: string;
}

interface MultaItem {
  fineId: string;
  patronId: string;
  patronName: string;
  patronCard: string;
  patronEmail: string;
  loanId: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  itemBarcode?: string;
  itemTitle?: string;
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
  coverImageUrl?: string | null;
}

const copFmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const ITEM_STATUS: Record<string, { label: string; color: string }> = {
  available:   { label: 'Disponible',   color: 'text-accent-green' },
  loaned:      { label: 'En préstamo',  color: 'text-accent-amber' },
  reserved:    { label: 'Reservado',    color: 'text-accent-amber' },
  maintenance: { label: 'Mantenimiento',color: 'text-text-muted'   },
  lost:        { label: 'Perdido',      color: 'text-accent-red'   },
  unavailable: { label: 'No disponible',color: 'text-text-muted'   },
};
const PATRON_STATUS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Activo',     color: 'text-accent-green' },
  suspended: { label: 'Suspendido', color: 'text-accent-red'   },
  expired:   { label: 'Expirado',   color: 'text-accent-amber' },
  blocked:   { label: 'Bloqueado',  color: 'text-accent-red'   },
};
const itemStatus  = (s: string) => ITEM_STATUS[s]   ?? { label: s, color: 'text-text-muted' };
const patronStatus = (s: string) => PATRON_STATUS[s] ?? { label: s, color: 'text-text-muted' };

const ESTADO_STYLES: Record<string, { label: string; cls: string }> = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-accent-amber/15 text-accent-amber border-accent-amber/20' },
  aprobada:   { label: 'Aprobada',   cls: 'bg-accent-green/15 text-accent-green border-accent-green/20' },
  rechazada:  { label: 'Rechazada',  cls: 'bg-accent-red/15 text-accent-red border-accent-red/20' },
  entregada:  { label: 'Entregada',  cls: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' },
  devuelta:   { label: 'Devuelta',   cls: 'bg-surface-raised text-text-muted border-surface-border' },
};

function useLookup<T>(type: 'patron' | 'item', query: string, delay = 400, forReturn = false) {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (!q || q.length < 3) { setResults([]); return; }

    timerRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/circulacion/lookup?type=${type}&q=${encodeURIComponent(q)}${forReturn ? '&forReturn=1' : ''}`)
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
  const [activeTab, setActiveTab] = useState<'operaciones' | 'prestamos' | 'gestion' | 'multas'>('operaciones');
  const [subTab, setSubTab] = useState<'loan' | 'return' | 'solicitudes'>('loan');
  const [multas, setMultas] = useState<MultaItem[]>([]);
  const [cargandoMultas, setCargandoMultas] = useState(false);
  const [multaAccion, setMultaAccion] = useState<Record<string, boolean>>({});
  const [filtroMultas, setFiltroMultas] = useState<'pending' | 'all'>('pending');
  const [editLoanModal, setEditLoanModal] = useState<{ id: string; dueDate: string; title: string } | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [actualizandoLoan, setActualizandoLoan] = useState(false);
  const [cancelandoLoan, setCancelandoLoan] = useState<string | null>(null);
  const [multaManualModal, setMultaManualModal] = useState<{ patronId: string; patronName: string; loanId: string } | null>(null);
  const [multaManualMonto, setMultaManualMonto] = useState('');
  const [multaManualRazon, setMultaManualRazon] = useState('');
  const [creandoMulta, setCreandoMulta] = useState(false);
  const [prestamosActivos, setPrestamosActivos] = useState<PrestamoActivo[]>([]);
  const [prestamosQuery, setPrestamosQuery] = useState('');
  const [cargandoPrestamos, setCargandoPrestamos] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<Record<string, 'return' | 'renew'>>({});
  const [accionMsg, setAccionMsg] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [loanOk, setLoanOk] = useState<LoanResult | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);
  const [returnOk, setReturnOk] = useState<ReturnResult | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [pendienteCount, setPendienteCount] = useState(0);
  const [countPrestamosActivos, setCountPrestamosActivos] = useState(0);

  const loanForm = useForm<LoanForm>();
  const returnForm = useForm<ReturnForm>();

  // Live lookup values
  const loanBarcode = loanForm.watch('itemBarcode') ?? '';
  const loanCarnet  = loanForm.watch('patronCardNumber') ?? '';
  const returnBarcode = returnForm.watch('itemBarcode') ?? '';

  const { results: loanItemResults, loading: loadingLoanItem }     = useLookup<ItemInfo>('item', loanBarcode);
  const { results: loanPatronResults, loading: loadingLoanPatron } = useLookup<PatronInfo>('patron', loanCarnet);
  const { results: returnItemResults, loading: loadingReturnItem } = useLookup<ItemInfo>('item', returnBarcode, 400, true);

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
        setCountPrestamosActivos(data.prestamosActivos ?? 0);
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

  // Marca la solicitud del portal de socios como devuelta cuando se registra una devolución
  const marcarSolicitudDevuelta = async (barcode: string, patronId?: string) => {
    try {
      const res = await fetch('/api/prestamos');
      if (!res.ok) return;
      const lista = await res.json() as Array<{ id: string; itemBarcode?: string; userId?: string; estado: string }>;
      const entregadas = lista.filter((s) => s.estado === 'entregada');
      // 1. Match exacto por barcode
      let sol = entregadas.find((s) => s.itemBarcode === barcode);
      // 2. Fallback: match por patronId si está disponible
      if (!sol && patronId) sol = entregadas.find((s) => s.userId === patronId);
      // 3. Último recurso: si solo hay una entregada, esa es
      if (!sol && entregadas.length === 1) sol = entregadas[0];
      if (sol) {
        await fetch(`/api/prestamos/${sol.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'devuelta' }),
        });
        cargarSolicitudes();
      }
    } catch { /* no bloquear el flujo principal */ }
  };

  const handleReturnInline = async (loanId: string, barcode: string, patronId?: string) => {
    setAccionEnCurso((prev) => ({ ...prev, [loanId]: 'return' }));
    try {
      const res = await fetch('/api/circulacion/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemBarcode: barcode }),
      });
      const data = await res.json() as { message?: string; fineAmount?: number };
      const ok = res.ok;
      const msg = ok
        ? `Devolución registrada${data.fineAmount ? ` · Multa: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(data.fineAmount)}` : ''}`
        : (data.message ?? 'Error al registrar devolución');
      setAccionMsg((prev) => ({ ...prev, [loanId]: { ok, msg } }));
      if (ok) {
        setPrestamosActivos((prev) => prev.filter((p) => p.id !== loanId));
        marcarSolicitudDevuelta(barcode, patronId);
      }
    } catch {
      setAccionMsg((prev) => ({ ...prev, [loanId]: { ok: false, msg: 'Error de conexión' } }));
    } finally {
      setAccionEnCurso((prev) => { const n = { ...prev }; delete n[loanId]; return n; });
    }
  };

  const handleRenewInline = async (loanId: string, barcode: string, patronCardNumber: string) => {
    setAccionEnCurso((prev) => ({ ...prev, [loanId]: 'renew' }));
    try {
      // Devolver primero, luego crear nuevo préstamo
      const retRes = await fetch('/api/circulacion/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemBarcode: barcode }),
      });
      if (!retRes.ok) {
        const d = await retRes.json() as { message?: string };
        throw new Error(d.message ?? 'Error al devolver para renovar');
      }
      const loanRes = await fetch('/api/circulacion/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemBarcode: barcode, patronCardNumber }),
      });
      const loanData = await loanRes.json() as { dueDate?: string; message?: string };
      if (!loanRes.ok) throw new Error(loanData.message ?? 'Error al registrar renovación');
      const nuevaFecha = loanData.dueDate ? new Date(loanData.dueDate).toLocaleDateString('es-CO') : '';
      setAccionMsg((prev) => ({ ...prev, [loanId]: { ok: true, msg: `Renovado${nuevaFecha ? ` · Vence ${nuevaFecha}` : ''}` } }));
      // Actualizar la fecha de vencimiento en la lista
      setPrestamosActivos((prev) =>
        prev.map((p) => p.id === loanId && loanData.dueDate ? { ...p, dueDate: loanData.dueDate!, status: 'active' } : p),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setAccionMsg((prev) => ({ ...prev, [loanId]: { ok: false, msg } }));
    } finally {
      setAccionEnCurso((prev) => { const n = { ...prev }; delete n[loanId]; return n; });
      setTimeout(() => setAccionMsg((prev) => { const n = { ...prev }; delete n[loanId]; return n; }), 5000);
    }
  };

  const cargarPrestamosTab = useCallback(async () => {
    setCargandoPrestamos(true);
    try {
      const res = await fetch('/api/circulacion/prestamos');
      if (res.ok) setPrestamosActivos(await res.json());
    } catch { /* ignorar */ } finally {
      setCargandoPrestamos(false);
    }
  }, []);

  const cargarMultas = useCallback(async () => {
    setCargandoMultas(true);
    try {
      const res = await fetch('/api/multas');
      if (res.ok) setMultas(await res.json());
    } catch { /* ignorar */ } finally {
      setCargandoMultas(false);
    }
  }, []);

  const handleUpdateDueDate = async () => {
    if (!editLoanModal || !nuevaFecha) return;
    setActualizandoLoan(true);
    try {
      const res = await fetch(`/api/circulacion/loan/${editLoanModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: nuevaFecha }),
      });
      if (res.ok) {
        setPrestamosActivos((prev) => prev.map((p) => p.id === editLoanModal.id ? { ...p, dueDate: nuevaFecha, status: 'active' } : p));
        setEditLoanModal(null);
      }
    } catch { /* ignorar */ } finally {
      setActualizandoLoan(false);
    }
  };

  const handleCancelLoan = async (loanId: string) => {
    setConfirmCancelId(loanId);
  };

  const doConfirmCancel = async () => {
    if (!confirmCancelId) return;
    const loanId = confirmCancelId;
    setConfirmCancelId(null);
    setCancelandoLoan(loanId);
    try {
      await fetch(`/api/circulacion/loan/${loanId}`, { method: 'DELETE' });
      setPrestamosActivos((prev) => prev.filter((p) => p.id !== loanId));
    } catch { /* ignorar */ } finally {
      setCancelandoLoan(null);
    }
  };

  const handleFineAction = async (fineId: string, patronId: string, action: 'paid' | 'waived') => {
    setMultaAccion((prev) => ({ ...prev, [fineId]: true }));
    try {
      await fetch(`/api/socios/${patronId}/multas/${fineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      const multaResuelta = multas.find((m) => m.fineId === fineId);
      // Si no quedan multas pendientes para ese préstamo, limpiar fineAmount en el préstamo
      if (multaResuelta) {
        const otrasDelLoan = multas.filter(
          (m) => m.loanId === multaResuelta.loanId && m.fineId !== fineId && m.status === 'pending',
        );
        if (otrasDelLoan.length === 0) {
          await fetch(`/api/circulacion/loan/${multaResuelta.loanId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fineAmount: 0 }),
          });
          setPrestamosActivos((prev) =>
            prev.map((p) => p.id === multaResuelta.loanId ? { ...p, fineAmount: 0 } : p),
          );
        }
      }
      setMultas((prev) => prev.map((m) => m.fineId === fineId ? { ...m, status: action } : m));
    } catch { /* ignorar */ } finally {
      setMultaAccion((prev) => { const n = { ...prev }; delete n[fineId]; return n; });
    }
  };

  const handleCrearMultaManual = async () => {
    if (!multaManualModal || !multaManualMonto) return;
    setCreandoMulta(true);
    try {
      const monto = Number(multaManualMonto);
      await fetch(`/api/socios/${multaManualModal.patronId}/multas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: multaManualModal.loanId,
          amount: monto,
          reason: multaManualRazon || 'Multa manual registrada por personal',
        }),
      });
      // Actualizar fineAmount del préstamo en circulación
      const loanActual = prestamosActivos.find((p) => p.id === multaManualModal.loanId);
      const nuevoTotal = (loanActual?.fineAmount ?? 0) + monto;
      await fetch(`/api/circulacion/loan/${multaManualModal.loanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fineAmount: nuevoTotal }),
      });
      setPrestamosActivos((prev) =>
        prev.map((p) => p.id === multaManualModal.loanId ? { ...p, fineAmount: nuevoTotal } : p),
      );
      setMultaManualModal(null);
      setMultaManualMonto('');
      setMultaManualRazon('');
      await cargarMultas();
    } catch { /* ignorar */ } finally {
      setCreandoMulta(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'prestamos' || activeTab === 'gestion') cargarPrestamosTab();
  }, [activeTab, cargarPrestamosTab]);

  useEffect(() => {
    cargarMultas();
  }, [cargarMultas]);

  useEffect(() => {
    if (activeTab === 'multas') cargarMultas();
  }, [activeTab, cargarMultas]);

  const cambiarEstado = async (id: string, estado: Solicitud['estado'], solicitud?: Solicitud) => {
    // Al entregar, primero crear el préstamo real en circulación
    if (estado === 'entregada' && solicitud?.itemBarcode && solicitud?.cardNumber) {
      const loanRes = await fetch('/api/circulacion/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemBarcode: solicitud.itemBarcode,
          patronCardNumber: solicitud.cardNumber,
        }),
      });
      if (!loanRes.ok) {
        const err = await loanRes.json() as { message?: string };
        alert(`No se pudo crear el préstamo: ${err.message ?? 'Error desconocido'}`);
        return;
      }
    }
    await fetch(`/api/prestamos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    cargarSolicitudes();
    if (estado === 'entregada') cargarPrestamosTab();
  };

  const handleLoan = async (data: LoanForm) => {
    setLoanOk(null);
    setLoanError(null);
    setLoadingGlobal(true);
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
        cargarStats();
      }
    } catch {
      setLoanError('No se pudo conectar con el servidor');
    } finally {
      setLoadingGlobal(false);
    }
  };

  const handleReturn = async (data: ReturnForm) => {
    setReturnOk(null);
    setReturnError(null);
    setLoadingGlobal(true);
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
        setPrestamosActivos((prev) => prev.filter((p) => p.itemBarcode !== data.itemBarcode));
        cargarStats();
        marcarSolicitudDevuelta(data.itemBarcode);
      }
    } catch {
      setReturnError('No se pudo conectar con el servidor');
    } finally {
      setLoadingGlobal(false);
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
          { key: 'operaciones', icon: BookOpen,        label: 'Operaciones'      },
          { key: 'prestamos',   icon: Library,         label: 'Préstamos activos'},
          { key: 'gestion',     icon: CalendarDays,    label: 'Gestión'          },
          { key: 'multas',      icon: BadgeDollarSign, label: 'Multas'           },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const multasPendientes = multas.filter((m) => m.status === 'pending').length;
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
              {tab.key === 'operaciones' && pendienteCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-amber px-1 font-mono text-[10px] font-bold text-white">
                  {pendienteCount}
                </span>
              )}
              {tab.key === 'prestamos' && countPrestamosActivos > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-blue px-1 font-mono text-[10px] font-bold text-white">
                  {countPrestamosActivos}
                </span>
              )}
              {tab.key === 'multas' && multasPendientes > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 font-mono text-[10px] font-bold text-white">
                  {multasPendientes}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── OPERACIONES: sub-tabs ── */}
      {activeTab === 'operaciones' && (
        <div className="flex gap-1 rounded-sm border border-surface-border bg-surface-raised p-0.5 w-fit">
          {([
            { key: 'loan',        icon: BookOpen,  label: 'Préstamo'   },
            { key: 'return',      icon: RefreshCw, label: 'Devolución' },
            { key: 'solicitudes', icon: Inbox,     label: 'Solicitudes'},
          ] as const).map((st) => {
            const Icon = st.icon;
            return (
              <button
                key={st.key}
                onClick={() => setSubTab(st.key)}
                className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                  subTab === st.key ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {st.label}
                {st.key === 'solicitudes' && pendienteCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-amber px-1 font-mono text-[10px] font-bold text-white">
                    {pendienteCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── SOLICITUDES ── */}
      {activeTab === 'operaciones' && subTab === 'solicitudes' && (
        <div className="space-y-3">
          {solicitudes.filter(s => s.estado !== 'devuelta').length === 0 ? (
            <div className="surface-card flex flex-col items-center py-16 text-center">
              <Inbox className="mb-3 h-10 w-10 text-text-muted/20" />
              <p className="font-mono text-xs text-text-muted">No hay solicitudes activas</p>
            </div>
          ) : (
            solicitudes.filter(s => s.estado !== 'devuelta').map((s) => {
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
                          onClick={() => cambiarEstado(s.id, 'entregada', s)}
                          className="flex items-center gap-1.5 rounded-sm border border-accent-green/30 px-3 py-1.5 font-mono text-xs text-accent-green hover:bg-accent-green/8 transition-colors"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" /> Aprobar y entregar
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
                          onClick={() => cambiarEstado(s.id, 'entregada', s)}
                          className="flex items-center gap-1.5 rounded-sm border border-accent-green/30 px-3 py-1.5 font-mono text-xs text-accent-green hover:bg-accent-green/8 transition-colors"
                        >
                          <Package className="h-3.5 w-3.5" /> Entregar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Historial de devueltas */}
          {solicitudes.filter(s => s.estado === 'devuelta').length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-mono text-xs text-text-muted hover:text-text-secondary select-none">
                {solicitudes.filter(s => s.estado === 'devuelta').length} solicitud(es) completada(s)
              </summary>
              <div className="mt-2 space-y-2">
                {solicitudes.filter(s => s.estado === 'devuelta').map((s) => (
                  <div key={s.id} className="surface-card flex items-center gap-3 px-4 py-3 opacity-60">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-text-secondary line-clamp-1">{s.bookTitle}</p>
                      <p className="font-mono text-xs text-text-muted">{s.userName}</p>
                    </div>
                    <span className="shrink-0 rounded-sm border px-2 py-0.5 font-mono text-xs bg-surface-raised text-text-muted border-surface-border">
                      Devuelta
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── PRÉSTAMOS ACTIVOS ── */}
      {activeTab === 'prestamos' && (() => {
        const copFmtTab = (n: number) =>
          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

        const q = prestamosQuery.toLowerCase().trim();
        const filtrados = q
          ? prestamosActivos.filter(
              (p) =>
                p.itemTitle.toLowerCase().includes(q) ||
                p.patronName.toLowerCase().includes(q) ||
                p.patronCardNumber.toLowerCase().includes(q) ||
                p.itemBarcode.toLowerCase().includes(q),
            )
          : prestamosActivos;

        return (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  value={prestamosQuery}
                  onChange={(e) => setPrestamosQuery(e.target.value)}
                  placeholder="Buscar por título, socio o código..."
                  className="input-dark w-full pl-8 py-2 text-sm"
                />
              </div>
              <span className="font-mono text-xs text-text-muted">
                {filtrados.length} préstamo{filtrados.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={cargarPrestamosTab}
                disabled={cargandoPrestamos}
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${cargandoPrestamos ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            {cargandoPrestamos ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-text-muted/30" />
                <p className="font-mono text-xs text-text-muted">Cargando préstamos...</p>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="surface-card flex flex-col items-center py-16 text-center">
                <Library className="mb-3 h-10 w-10 text-text-muted/20" />
                <p className="font-mono text-xs text-text-muted">
                  {prestamosQuery ? 'Sin resultados para esa búsqueda' : 'No hay préstamos activos'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="prestamos-grid">
                {filtrados.map((p) => {
                  const vencido = p.status === 'overdue';
                  const diasVence = Math.ceil(
                    (new Date(p.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                  return (
                    <div
                      key={p.id}
                      className={`surface-card overflow-hidden flex flex-col ${vencido ? 'ring-1 ring-accent-red/30' : ''}`}
                    >
                      {/* Header con portada + info del libro */}
                      <div className="flex gap-3 p-4 border-b border-surface-border">
                        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-sm bg-surface-raised">
                          {p.coverImageUrl ? (
                            <Image
                              src={p.coverImageUrl}
                              alt={p.itemTitle}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-text-muted/30" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-body text-sm font-medium text-text-primary leading-snug">
                            {p.itemTitle}
                          </p>
                          {p.itemAuthors && (
                            <p className="mt-0.5 truncate font-mono text-xs text-text-muted">{p.itemAuthors}</p>
                          )}
                          <p className="mt-1 font-mono text-[10px] text-text-muted">{p.itemBarcode}</p>
                          {p.itemLocation && (
                            <p className="font-mono text-[10px] text-text-muted">{p.itemLocation}</p>
                          )}
                        </div>
                      </div>

                      {/* Info del socio */}
                      <div className="flex items-center gap-2 border-b border-surface-border px-4 py-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-raised">
                          <User className="h-3.5 w-3.5 text-text-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-body text-xs font-medium text-text-primary">{p.patronName}</p>
                          <p className="font-mono text-[10px] text-text-muted">{p.patronCardNumber}</p>
                        </div>
                        <span className={`shrink-0 font-mono text-[10px] ${p.patronStatus === 'active' ? 'text-accent-green' : 'text-accent-red'}`}>
                          {p.patronStatus === 'active' ? 'Activo' : p.patronStatus}
                        </span>
                      </div>

                      {/* Fechas + estado */}
                      <div className="grid grid-cols-2 gap-2 px-4 py-3 text-xs">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Prestado</p>
                          <p className="font-mono text-xs text-text-secondary">
                            {new Date(p.loanDate).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Vence</p>
                          <p className={`font-mono text-xs font-medium ${vencido ? 'text-accent-red' : diasVence <= 3 ? 'text-accent-amber' : 'text-text-secondary'}`}>
                            {new Date(p.dueDate).toLocaleDateString('es-CO')}
                            {vencido && ' · Vencido'}
                            {!vencido && diasVence <= 3 && ` · ${diasVence}d`}
                          </p>
                        </div>
                        {p.renewedCount > 0 && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Renovaciones</p>
                            <p className="font-mono text-xs text-text-secondary">{p.renewedCount}</p>
                          </div>
                        )}
                        {p.fineAmount > 0 && (
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Multa</p>
                            <p className="font-mono text-xs font-medium text-accent-red">{copFmtTab(p.fineAmount)}</p>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="mt-auto flex flex-col gap-2 border-t border-surface-border p-3">
                        {accionMsg[p.id] && (
                          <p className={`rounded-sm px-2 py-1 font-mono text-[10px] ${accionMsg[p.id].ok ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                            {accionMsg[p.id].msg}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            disabled={!!accionEnCurso[p.id]}
                            onClick={() => handleReturnInline(p.id, p.itemBarcode, p.patronId)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-surface-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors disabled:opacity-40"
                          >
                            {accionEnCurso[p.id] === 'return'
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <RefreshCw className="h-3 w-3" />}
                            Devolución
                          </button>
                          <button
                            disabled={!!accionEnCurso[p.id]}
                            onClick={() => handleRenewInline(p.id, p.itemBarcode, p.patronCardNumber)}
                            className="flex items-center gap-1.5 rounded-sm border border-accent-green/30 px-3 py-1.5 font-mono text-xs text-accent-green hover:bg-accent-green/8 transition-colors disabled:opacity-40"
                          >
                            {accionEnCurso[p.id] === 'renew'
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <BookOpen className="h-3 w-3" />}
                            Renovar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        );
      })()}

      {/* ── GESTIÓN DE PRÉSTAMOS ── */}
      {activeTab === 'gestion' && (() => {
        const q = prestamosQuery.toLowerCase().trim();
        const filtrados = q
          ? prestamosActivos.filter(
              (p) =>
                p.itemTitle.toLowerCase().includes(q) ||
                p.patronName.toLowerCase().includes(q) ||
                p.patronCardNumber.toLowerCase().includes(q) ||
                p.itemBarcode.toLowerCase().includes(q),
            )
          : prestamosActivos;

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  value={prestamosQuery}
                  onChange={(e) => setPrestamosQuery(e.target.value)}
                  placeholder="Buscar préstamo..."
                  className="input-dark w-full pl-8 py-2 text-sm"
                />
              </div>
              <button onClick={cargarPrestamosTab} disabled={cargandoPrestamos} className="btn-ghost flex items-center gap-1.5 text-sm">
                <RotateCcw className={`h-3.5 w-3.5 ${cargandoPrestamos ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            {cargandoPrestamos ? (
              <div className="flex flex-col items-center py-16">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-text-muted/30" />
                <p className="font-mono text-xs text-text-muted">Cargando...</p>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="surface-card flex flex-col items-center py-16">
                <Library className="mb-3 h-10 w-10 text-text-muted/20" />
                <p className="font-mono text-xs text-text-muted">No hay préstamos activos</p>
              </div>
            ) : (
              <div className="surface-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Ejemplar</th>
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Socio</th>
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Vence</th>
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Estado</th>
                      <th className="px-4 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filtrados.map((p) => {
                      const vencido = p.status === 'overdue';
                      return (
                        <tr key={p.id} className="hover:bg-surface-raised/40 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-body text-xs font-medium text-text-primary line-clamp-1">{p.itemTitle}</p>
                            <p className="font-mono text-[10px] text-text-muted">{p.itemBarcode}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-body text-xs text-text-primary">{p.patronName}</p>
                            <p className="font-mono text-[10px] text-text-muted">{p.patronCardNumber}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className={`font-mono text-xs ${vencido ? 'text-accent-red font-medium' : 'text-text-secondary'}`}>
                              {new Date(p.dueDate).toLocaleDateString('es-CO')}
                            </p>
                            {vencido && <p className="font-mono text-[10px] text-accent-red">Vencido</p>}
                          </td>
                          <td className="px-4 py-3">
                            {p.fineAmount > 0 ? (
                              <span className="font-mono text-xs text-accent-red">{copFmt(p.fineAmount)}</span>
                            ) : (
                              <span className="font-mono text-[10px] text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => { setEditLoanModal({ id: p.id, dueDate: p.dueDate.slice(0, 10), title: p.itemTitle }); setNuevaFecha(p.dueDate.slice(0, 10)); }}
                                className="flex items-center gap-1 rounded-sm border border-surface-border px-2 py-1 font-mono text-[10px] text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
                                title="Cambiar fecha de vencimiento"
                              >
                                <Pencil className="h-3 w-3" /> Fecha
                              </button>
                              <button
                                disabled={cancelandoLoan === p.id}
                                onClick={() => handleCancelLoan(p.id)}
                                className="flex items-center gap-1 rounded-sm border border-accent-red/30 px-2 py-1 font-mono text-[10px] text-accent-red hover:bg-accent-red/8 transition-colors disabled:opacity-40"
                                title="Cancelar préstamo"
                              >
                                {cancelandoLoan === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        );
      })()}

      {/* ── MULTAS ── */}
      {activeTab === 'multas' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 rounded-sm border border-surface-border bg-surface-raised p-0.5">
              {(['pending', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroMultas(f)}
                  className={`rounded-sm px-3 py-1 font-mono text-xs transition-colors ${filtroMultas === f ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                >
                  {f === 'pending' ? 'Pendientes' : 'Todas'}
                </button>
              ))}
            </div>
            <button onClick={cargarMultas} disabled={cargandoMultas} className="btn-ghost flex items-center gap-1.5 text-sm">
              <RotateCcw className={`h-3.5 w-3.5 ${cargandoMultas ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {cargandoMultas ? (
            <div className="flex flex-col items-center py-16">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-text-muted/30" />
              <p className="font-mono text-xs text-text-muted">Cargando multas...</p>
            </div>
          ) : (() => {
            const multasFiltradas = filtroMultas === 'pending'
              ? multas.filter((m) => m.status === 'pending')
              : multas;
            return multasFiltradas.length === 0 ? (
              <div className="surface-card flex flex-col items-center py-16">
                <BadgeDollarSign className="mb-3 h-10 w-10 text-text-muted/20" />
                <p className="font-mono text-xs text-text-muted">
                  {filtroMultas === 'pending' ? 'No hay multas pendientes' : 'No hay multas registradas'}
                </p>
              </div>
            ) : (
              <div className="surface-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Socio</th>
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Ejemplar</th>
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Motivo</th>
                      <th className="px-4 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">Monto</th>
                      <th className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Estado</th>
                      <th className="px-4 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {multasFiltradas.map((m) => (
                      <tr key={m.fineId} className="hover:bg-surface-raised/40 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-body text-xs font-medium text-text-primary">{m.patronName}</p>
                          <p className="font-mono text-[10px] text-text-muted">{m.patronCard}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-body text-xs text-text-secondary line-clamp-1">{m.itemTitle ?? m.itemBarcode ?? '—'}</p>
                          <p className="font-mono text-[10px] text-text-muted">{new Date(m.createdAt).toLocaleDateString('es-CO')}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-text-muted line-clamp-1 max-w-[160px]">{m.reason}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-xs font-medium text-accent-red">{copFmt(m.amount)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {m.status === 'pending' && (
                            <span className="rounded-sm border border-accent-amber/20 bg-accent-amber/10 px-2 py-0.5 font-mono text-[10px] text-accent-amber">Pendiente</span>
                          )}
                          {m.status === 'paid' && (
                            <span className="rounded-sm border border-accent-green/20 bg-accent-green/10 px-2 py-0.5 font-mono text-[10px] text-accent-green">Pagada</span>
                          )}
                          {m.status === 'waived' && (
                            <span className="rounded-sm border border-surface-border bg-surface-raised px-2 py-0.5 font-mono text-[10px] text-text-muted">Condonada</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {m.status === 'pending' && (
                              <>
                                <button
                                  disabled={multaAccion[m.fineId]}
                                  onClick={() => handleFineAction(m.fineId, m.patronId, 'paid')}
                                  className="flex items-center gap-1 rounded-sm border border-accent-green/30 px-2 py-1 font-mono text-[10px] text-accent-green hover:bg-accent-green/8 transition-colors disabled:opacity-40"
                                  title="Marcar como pagada"
                                >
                                  {multaAccion[m.fineId] ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                                  Pagada
                                </button>
                                <button
                                  disabled={multaAccion[m.fineId]}
                                  onClick={() => handleFineAction(m.fineId, m.patronId, 'waived')}
                                  className="flex items-center gap-1 rounded-sm border border-surface-border px-2 py-1 font-mono text-[10px] text-text-muted hover:bg-surface-raised transition-colors disabled:opacity-40"
                                  title="Condonar multa"
                                >
                                  {multaAccion[m.fineId] ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldOff className="h-3 w-3" />}
                                  Condonar
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setMultaManualModal({ patronId: m.patronId, patronName: m.patronName, loanId: m.loanId })}
                              className="flex items-center gap-1 rounded-sm border border-accent-blue/30 px-2 py-1 font-mono text-[10px] text-accent-blue hover:bg-accent-blue/8 transition-colors"
                              title="Crear multa manual"
                            >
                              <BadgeDollarSign className="h-3 w-3" />
                              +Multa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── MODAL: Editar fecha de vencimiento ── */}
      {editLoanModal && (
        <div className="fixed inset-0 z-[9999] mt-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,13,18,0.80)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-sm border border-surface-border bg-surface-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-text-primary">Cambiar fecha de vencimiento</h3>
              <button onClick={() => setEditLoanModal(null)} className="text-text-muted hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 font-body text-xs text-text-muted line-clamp-2">{editLoanModal.title}</p>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Nueva fecha</label>
            <div className="mb-4">
              <DatePicker value={nuevaFecha} onChange={setNuevaFecha} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditLoanModal(null)} className="btn-ghost text-sm">Cancelar</button>
              <button
                onClick={handleUpdateDueDate}
                disabled={actualizandoLoan || !nuevaFecha}
                className="btn-green text-sm disabled:opacity-40"
              >
                {actualizandoLoan ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Multa manual ── */}
      {multaManualModal && (
        <div className="fixed inset-0 z-[9999] mt-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,13,18,0.80)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-sm border border-surface-border bg-surface-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-text-primary">Crear multa manual</h3>
              <button onClick={() => setMultaManualModal(null)} className="text-text-muted hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 font-body text-xs text-text-muted">{multaManualModal.patronName}</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Monto (COP)</label>
                <input
                  type="number"
                  min="0"
                  value={multaManualMonto}
                  onChange={(e) => setMultaManualMonto(e.target.value)}
                  placeholder="Ej: 5000"
                  className="input-dark w-full"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Motivo</label>
                <input
                  type="text"
                  value={multaManualRazon}
                  onChange={(e) => setMultaManualRazon(e.target.value)}
                  placeholder="Descripción del motivo..."
                  className="input-dark w-full"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => { setMultaManualModal(null); setMultaManualMonto(''); setMultaManualRazon(''); }} className="btn-ghost text-sm">Cancelar</button>
              <button
                onClick={handleCrearMultaManual}
                disabled={creandoMulta || !multaManualMonto}
                className="btn-green text-sm disabled:opacity-40"
              >
                {creandoMulta ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creando...</> : 'Crear multa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRÉSTAMO / DEVOLUCIÓN ── */}
      {activeTab === 'operaciones' && subTab !== 'solicitudes' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Panel de formulario */}
          <div className="surface-card p-6">
            {subTab === 'loan' ? (
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
                  {!selectedLoanItem && loanItemResults.length > 0 && !(loanItemResults.length === 1 && loanBarcode === loanItemResults[0]?.barcode) && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-sm border border-surface-border bg-surface-card shadow-lg">
                      {loanItemResults.map((item) => (
                        <button
                          key={item.barcode}
                          type="button"
                          onClick={() => {
                            loanForm.setValue('itemBarcode', item.barcode);
                            setSelectedLoanItem(item);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-raised"
                        >
                          <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-sm bg-surface-raised">
                            {item.coverImageUrl
                              ? <Image src={item.coverImageUrl} alt={item.title ?? ''} fill className="object-cover" sizes="28px" />
                              : <BookOpen className="absolute inset-0 m-auto h-3 w-3 text-text-muted/40" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-body text-xs font-medium text-text-primary">{item.title || 'Sin título'}</p>
                            <p className="font-mono text-[10px] text-text-muted">{item.barcode} · {item.location}</p>
                          </div>
                          <span className={`shrink-0 font-mono text-[10px] ${itemStatus(item.status).color}`}>
                            {itemStatus(item.status).label}
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
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-sm bg-surface-raised">
                              {item.coverImageUrl
                                ? <Image src={item.coverImageUrl} alt={item.title ?? ''} fill className="object-cover" sizes="28px" />
                                : <BookOpen className="absolute inset-0 m-auto h-3 w-3 text-text-muted/40" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-xs font-medium text-text-primary truncate max-w-[180px]">
                                {item.title ?? item.barcode}
                              </p>
                              <p className="font-mono text-xs text-text-muted">{item.location}</p>
                            </div>
                            <span className={`shrink-0 font-mono text-xs ${itemStatus(item.status).color}`}>
                              {itemStatus(item.status).label}
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
                          <span className={`font-mono text-[10px] ${patronStatus(patron.status).color}`}>
                            {patronStatus(patron.status).label}
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
                            <span className={`font-mono text-xs ${patronStatus(patron.status).color}`}>
                              {patronStatus(patron.status).label}
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
                  {!selectedReturnItem && returnItemResults.length > 0 && !(returnItemResults.length === 1 && returnBarcode === returnItemResults[0]?.barcode) && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-sm border border-surface-border bg-surface-card shadow-lg">
                      {returnItemResults.map((item) => (
                        <button
                          key={item.barcode}
                          type="button"
                          onClick={() => {
                            returnForm.setValue('itemBarcode', item.barcode);
                            setSelectedReturnItem(item);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-raised"
                        >
                          <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-sm bg-surface-raised">
                            {item.coverImageUrl
                              ? <Image src={item.coverImageUrl} alt={item.title ?? ''} fill className="object-cover" sizes="28px" />
                              : <BookOpen className="absolute inset-0 m-auto h-3 w-3 text-text-muted/40" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-body text-xs font-medium text-text-primary">{item.title || 'Sin título'}</p>
                            <p className="font-mono text-[10px] text-text-muted">{item.barcode} · {item.location}</p>
                          </div>
                          <span className={`shrink-0 font-mono text-[10px] ${itemStatus(item.status).color}`}>
                            {itemStatus(item.status).label}
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
                          <div className="flex items-center gap-2.5">
                            <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-sm bg-surface-raised">
                              {item.coverImageUrl
                                ? <Image src={item.coverImageUrl} alt={item.title ?? ''} fill className="object-cover" sizes="28px" />
                                : <BookOpen className="absolute inset-0 m-auto h-3 w-3 text-text-muted/40" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-xs font-medium text-text-primary truncate max-w-[180px]">
                                {item.title ?? item.barcode}
                              </p>
                              <p className="font-mono text-xs text-text-muted">{item.location}</p>
                            </div>
                            <span className={`shrink-0 font-mono text-xs ${itemStatus(item.status).color}`}>
                              {itemStatus(item.status).label}
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

            {subTab === 'loan' && loanOk ? (
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
            ) : subTab === 'loan' && loanError ? (
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
            ) : subTab === 'return' && returnOk ? (
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
            ) : subTab === 'return' && returnError ? (
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
      {activeTab === 'operaciones' && subTab === 'solicitudes' && solicitudes.length > 0 && (
        <p className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
          <Clock className="h-3 w-3" /> Actualización automática cada 8 s
        </p>
      )}

      {/* Confirmación cancelar préstamo */}
      {confirmCancelId && (
        <ConfirmModal
          title="¿Cancelar este préstamo?"
          description="El ejemplar volverá a estar disponible sin registrar multa."
          confirmLabel="Cancelar préstamo"
          variant="danger"
          onConfirm={doConfirmCancel}
          onCancel={() => setConfirmCancelId(null)}
        />
      )}

      {/* Loading global */}
      {loadingGlobal && <LoadingOverlay label="Procesando..." />}
    </div>
  );
}
