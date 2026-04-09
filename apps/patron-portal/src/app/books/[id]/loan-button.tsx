'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, CheckCircle, Clock, Package, X, LogIn, Loader2, XCircle } from 'lucide-react';
import { LoadingModal } from '@/components/ui/skeleton';

interface LoanButtonProps {
  bookId: string;
  bookTitle: string;
  itemBarcode?: string;
  variant?: 'full' | 'inline';
}

interface UserCookie {
  fullName?: string;
  id?: string;
  cardNumber?: string;
}

interface Solicitud {
  id: string;
  bookId: string;
  itemBarcode?: string;
  userId: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada' | 'devuelta';
}

type Estado = 'idle' | 'pendiente' | 'aprobada' | 'entregada' | 'rechazada';

const ESTADO_CONFIG: Record<Exclude<Estado, 'idle'>, {
  full: string; inline: string;
  cls: string;
  icon: React.ElementType;
}> = {
  pendiente: {
    full: 'Solicitud enviada — pendiente de aprobación',
    inline: 'Solicitado',
    cls: 'border-amber-book/30 bg-amber-book/8 text-amber-book',
    icon: Clock,
  },
  aprobada: {
    full: 'Aprobada — pasa a recoger el libro',
    inline: 'Aprobada',
    cls: 'border-emerald-library/30 bg-emerald-pale text-emerald-library',
    icon: CheckCircle,
  },
  entregada: {
    full: 'Préstamo activo — ya tienes el libro',
    inline: 'Entregado',
    cls: 'border-emerald-library/30 bg-emerald-pale text-emerald-library',
    icon: Package,
  },
  rechazada: {
    full: 'Solicitud rechazada por el personal',
    inline: 'Rechazada',
    cls: 'border-rust/30 bg-rust/5 text-rust',
    icon: XCircle,
  },
};

export default function LoanButton({ bookId, bookTitle, itemBarcode, variant = 'full' }: LoanButtonProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const storageKey = `loan_requested_${bookId}_${itemBarcode ?? 'any'}`;
  const [estado, setEstado] = useState<Estado>('idle');
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const resetearSolicitud = useCallback(() => {
    setEstado('idle');
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Consulta el estado real de la solicitud en el servidor
  const sincronizarEstado = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      const res = await fetch('/api/prestamos');
      if (!res.ok) return;
      const lista = await res.json() as Solicitud[];
      const sol = lista.find(
        (s) => s.bookId === bookId &&
               s.userId === uid &&
               (!itemBarcode || s.itemBarcode === itemBarcode),
      );
      if (sol && sol.estado !== 'devuelta') {
        // Si sigue como entregada, verificar si el ejemplar ya está disponible
        if (sol.estado === 'entregada' && itemBarcode) {
          const dispRes = await fetch(`/api/disponibilidad?barcode=${encodeURIComponent(itemBarcode)}`).catch(() => null);
          if (dispRes?.ok) {
            const disp = await dispRes.json() as { available: boolean };
            if (disp.available) { resetearSolicitud(); return; }
          }
        }
        setEstado(sol.estado);
        if (sol.estado !== 'rechazada') {
          localStorage.setItem(storageKey, '1');
        } else {
          localStorage.removeItem(storageKey);
        }
      } else {
        resetearSolicitud();
      }
    } catch { /* ignorar */ }
  }, [bookId, itemBarcode, storageKey, resetearSolicitud]);

  useEffect(() => {
    const userCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_user='));
    if (!userCookie) return;
    try {
      const u = JSON.parse(decodeURIComponent(userCookie.split('=').slice(1).join('='))) as UserCookie;
      setUserName(u.fullName?.split(' ')[0] ?? 'Socio');
      setUserId(u.id ?? '');
      setCardNumber(u.cardNumber ?? '');
      setIsLoggedIn(true);

      const uid = u.id ?? '';
      // Si localStorage indica que hay solicitud previa, sincronizar con el servidor
      if (localStorage.getItem(storageKey) === '1') {
        setEstado('pendiente'); // provisional hasta que llega la respuesta
        sincronizarEstado(uid);
      }
    } catch { /* ignorar */ }
  }, [storageKey, sincronizarEstado]);

  // Polling cada 8s mientras hay una solicitud activa en curso
  useEffect(() => {
    if (!userId || estado === 'idle' || estado === 'rechazada') return;
    const interval = setInterval(() => sincronizarEstado(userId), 8000);
    return () => clearInterval(interval);
  }, [userId, estado, sincronizarEstado]);

  const solicitarPrestamo = async () => {
    if (!cardNumber) {
      setToast({ message: 'No se encontró tu número de carnet. Reintenta el login.', type: 'error' });
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/prestamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, bookTitle, userId, userName, cardNumber, itemBarcode }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Error al procesar la solicitud');

      setEstado('pendiente');
      localStorage.setItem(storageKey, '1');
      setToast({
        message: `¡Solicitud enviada! El personal de la biblioteca confirmará tu préstamo de "${bookTitle}" a la brevedad.`,
        type: 'success',
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setToast({ message: msg, type: 'error' });
    } finally {
      setEnviando(false);
      setTimeout(() => setToast(null), 8000);
    }
  };

  const buttonClass = variant === 'full'
    ? 'btn-amber w-full justify-center'
    : 'btn-amber px-3 py-1 text-xs justify-center';

  return (
    <>
      {enviando && <LoadingModal label="Enviando solicitud..." />}
      {isLoggedIn ? (
        estado !== 'idle' ? (() => {
          const cfg = ESTADO_CONFIG[estado];
          const Icon = cfg.icon;
          return (
            <div className="flex flex-col gap-1">
              <div className={`flex items-center gap-2 rounded-sm border font-body ${variant === 'full' ? 'px-4 py-3 text-sm' : 'px-2 py-1 text-xs'} ${cfg.cls}`}>
                <Icon className={variant === 'full' ? 'h-4 w-4 shrink-0' : 'h-3 w-3 shrink-0'} />
                <span>{variant === 'full' ? cfg.full : cfg.inline}</span>
              </div>
              {estado === 'entregada' && (
                <button
                  onClick={resetearSolicitud}
                  className="font-mono text-[10px] text-ink-muted/60 hover:text-amber-book underline text-left"
                >
                  ¿Ya devolviste el libro? Solicitar de nuevo
                </button>
              )}
            </div>
          );
        })() : (
          <button onClick={solicitarPrestamo} disabled={enviando} className={buttonClass}>
            {enviando
              ? <Loader2 className={variant === 'full' ? 'h-4 w-4 animate-spin' : 'h-3 w-3 animate-spin'} />
              : <BookOpen className={variant === 'full' ? 'h-4 w-4' : 'h-3 w-3'} />}
            {enviando ? 'Procesando...' : variant === 'full' ? 'Solicitar préstamo' : 'Pedir este'}
          </button>
        )
      ) : (
        <Link href={`/login?redirect=/books/${bookId}`} className={buttonClass}>
          <LogIn className={variant === 'full' ? 'h-4 w-4' : 'h-3 w-3'} />
          {variant === 'full' ? 'Inicia sesión para solicitar' : 'Inicia sesión'}
        </Link>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-sm border px-5 py-3 shadow-lg font-body text-sm ${
          toast.type === 'success'
            ? 'border-emerald-library/30 bg-emerald-library/10 text-emerald-library'
            : 'border-rust/30 bg-rust/5 text-rust'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
