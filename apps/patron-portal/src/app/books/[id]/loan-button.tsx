'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, X, LogIn, Loader2 } from 'lucide-react';

interface LoanButtonProps {
  bookId: string;
  bookTitle: string;
  itemBarcode?: string; // Nuevo: permitir elegir ejemplar específico
  variant?: 'full' | 'inline'; // Nuevo: para diseño compacto en la lista de ejemplares
}

interface UserCookie {
  fullName?: string;
  id?: string;
  cardNumber?: string;
}

export default function LoanButton({ bookId, bookTitle, itemBarcode, variant = 'full' }: LoanButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const storageKey = `loan_requested_${bookId}_${itemBarcode ?? 'any'}`;
  const [solicitado, setSolicitado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const userCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_user='));
    if (userCookie) {
      try {
        const u = JSON.parse(
          decodeURIComponent(userCookie.split('=').slice(1).join('=')),
        ) as UserCookie;
        setUserName(u.fullName?.split(' ')[0] ?? 'Socio');
        setUserId(u.id ?? '');
        setCardNumber(u.cardNumber ?? '');
        setIsLoggedIn(true);
        // Verificar si ya fue solicitado (localStorage o préstamos activos)
        if (localStorage.getItem(storageKey) === '1') {
          setSolicitado(true);
        }
      } catch { /* ignorar */ }
    }
  }, [storageKey]);

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al procesar el préstamo');
      }

      setSolicitado(true);
      localStorage.setItem(storageKey, '1');
      setToast({
        message: `¡Préstamo concedido! El libro "${bookTitle}" ya es tuyo hasta el ${new Date(data.dueDate).toLocaleDateString()}.`,
        type: 'success'
      });
    } catch (err: any) {
      setToast({ message: err.message || 'Error de conexión', type: 'error' });
    } finally {
      setEnviando(false);
      setTimeout(() => setToast(null), 8000);
    }
  };

  const buttonClass = variant === 'full' 
    ? "btn-amber w-full justify-center" 
    : "btn-amber px-3 py-1 text-xs justify-center";

  return (
    <>
      {isLoggedIn ? (
        solicitado ? (
          <div className={`flex items-center gap-2 rounded-sm border border-emerald-library/30 bg-emerald-pale font-body text-emerald-library ${variant === 'full' ? 'px-4 py-3 text-sm' : 'px-2 py-1 text-xs'}`}>
            <CheckCircle className={variant === 'full' ? "h-4 w-4 shrink-0" : "h-3 w-3 shrink-0"} />
            <span>{variant === 'full' ? 'Préstamo activo — ya puedes pasar por el libro' : 'Concedido'}</span>
          </div>
        ) : (
          <button
            onClick={solicitarPrestamo}
            disabled={enviando}
            className={buttonClass}
          >
            {enviando
              ? <Loader2 className={variant === 'full' ? "h-4 w-4 animate-spin" : "h-3 w-3 animate-spin"} />
              : <BookOpen className={variant === 'full' ? "h-4 w-4" : "h-3 w-3"} />}
            {enviando ? 'Procesando...' : (variant === 'full' ? 'Solicitar préstamo' : 'Pedir este')}
          </button>
        )
      ) : (
        <Link
          href={`/login?redirect=/books/${bookId}`}
          className={buttonClass}
        >
          <LogIn className={variant === 'full' ? "h-4 w-4" : "h-3 w-3"} /> {variant === 'full' ? 'Inicia sesión para solicitar' : 'Inicia sesión'}
        </Link>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-sm border px-5 py-3 shadow-lg font-body text-sm ${
          toast.type === 'success'
            ? 'border-emerald-library/30 bg-emerald-library/10 text-emerald-library'
            : 'border-red-800/30 bg-red-50 text-red-800'
        }`}>
          <CheckCircle className={`mt-0.5 h-4 w-4 shrink-0 ${toast.type === 'error' ? 'hidden' : ''}`} />
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
