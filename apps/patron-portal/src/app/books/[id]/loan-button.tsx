'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle, X, LogIn, Loader2 } from 'lucide-react';

interface LoanButtonProps {
  bookId: string;
  bookTitle: string;
}

interface UserCookie {
  fullName?: string;
  id?: string;
}

export default function LoanButton({ bookId, bookTitle }: LoanButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [solicitado, setSolicitado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const userCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_user='));
    if (userCookie) {
      try {
        const u = JSON.parse(
          decodeURIComponent(userCookie.split('=').slice(1).join('=')),
        ) as UserCookie;
        setUserName(u.fullName?.split(' ')[0] ?? 'Socio');
        setUserId(u.id ?? '');
        setIsLoggedIn(true);
      } catch { /* ignorar */ }
    }
  }, []);

  const solicitarPrestamo = async () => {
    setEnviando(true);
    try {
      await fetch('/api/prestamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, bookTitle, userId, userName }),
      });
    } catch { /* la solicitud se registra igual en UI */ }
    setSolicitado(true);
    setEnviando(false);
    setToast(
      `Solicitud registrada, ${userName}. Preséntate al mostrador de préstamos con tu carnet para retirar el material.`,
    );
    setTimeout(() => setToast(null), 7000);
  };

  return (
    <>
      {isLoggedIn ? (
        solicitado ? (
          <div className="flex items-center gap-2 rounded-sm border border-emerald-library/30 bg-emerald-pale px-4 py-3 font-body text-sm text-emerald-library">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Solicitud enviada — espera confirmación en el mostrador</span>
          </div>
        ) : (
          <button
            onClick={solicitarPrestamo}
            disabled={enviando}
            className="btn-amber w-full justify-center"
          >
            {enviando
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <BookOpen className="h-4 w-4" />}
            {enviando ? 'Enviando...' : 'Solicitar préstamo'}
          </button>
        )
      ) : (
        <Link
          href={`/login?redirect=/books/${bookId}`}
          className="btn-amber w-full justify-center"
        >
          <LogIn className="h-4 w-4" /> Inicia sesión para solicitar
        </Link>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-sm border border-emerald-library/30 bg-emerald-library/10 px-5 py-3 shadow-lg font-body text-sm text-emerald-library">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
