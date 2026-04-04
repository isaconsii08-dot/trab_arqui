'use client';

import { useEffect, useState } from 'react';
import { Clock, BookOpen, AlertTriangle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import Link from 'next/link';
import Image from 'next/image';

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

export default function DashboardPage() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [usuario, setUsuario] = useState<{ sub: string; role: string; fullName: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Leer info del usuario desde cookie (no httpOnly)
    const userCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_user='));
    const tokenCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_token='));

    if (userCookie) {
      try {
        const decoded = JSON.parse(decodeURIComponent(userCookie.split('=')[1] ?? '')) as { sub: string; role: string; fullName: string };
        setUsuario(decoded);
      } catch { /* cookie malformada */ }
    }
    if (tokenCookie) {
      setToken(decodeURIComponent(tokenCookie.split('=').slice(1).join('=')));
    }
  }, []);

  useEffect(() => {
    if (!usuario || !token) {
      // Sin sesión: mostrar préstamos del socio de demostración
      cargarPrestamosDemo();
      return;
    }
    cargarPrestamos(usuario.sub, token);
  }, [usuario, token]);

  async function cargarPrestamosDemo() {
    // Préstamos del socio pat-001 para la demo
    try {
      const res = await fetch('/api/prestamos-demo');
      if (res.ok) {
        const data = await res.json() as { data: Prestamo[] };
        setPrestamos(data.data ?? []);
      }
    } catch { /* ignorar */ } finally {
      setCargando(false);
    }
  }

  async function cargarPrestamos(patronId: string, jwt: string) {
    try {
      const res = await fetch(
        `http://localhost:3004/api/v1/circulation/loans/active?patronId=${patronId}`,
        { headers: { Authorization: `Bearer ${jwt}` } },
      );
      if (res.ok) {
        const data = await res.json() as { data: Prestamo[] };
        setPrestamos(data.data ?? []);
      }
    } catch { /* ignorar */ } finally {
      setCargando(false);
    }
  }

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
            </p>
          </div>

          {/* Alerta vencidos */}
          {vencidos.length > 0 && (
            <div className="mb-8 flex items-start gap-3 rounded-sm border border-rust/30 bg-rust/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rust" />
              <div>
                <p className="font-body text-sm font-medium text-rust">
                  Tienes {vencidos.length} préstamo{vencidos.length > 1 ? 's' : ''} vencido{vencidos.length > 1 ? 's' : ''}
                </p>
                <p className="mt-0.5 font-body text-xs text-rust/70">
                  Devuelve los materiales cuanto antes. Multa acumulada:{' '}
                  <strong>${multaTotal.toFixed(2)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Préstamos activos', value: activos.length, icon: BookOpen, color: 'text-emerald-library' },
              { label: 'Vencidos', value: vencidos.length, icon: Clock, color: vencidos.length > 0 ? 'text-rust' : 'text-ink-muted' },
              { label: 'Multas pendientes', value: `$${multaTotal.toFixed(2)}`, icon: AlertTriangle, color: multaTotal > 0 ? 'text-amber-book' : 'text-ink-muted' },
              { label: 'Total préstamos', value: prestamos.length, icon: BookOpen, color: 'text-ink-muted' },
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

          {/* Préstamos activos */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Préstamos activos</h2>
              <Link href="/dashboard/historial" className="font-mono text-xs text-amber-book hover:underline">
                Ver historial →
              </Link>
            </div>

            {cargando ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="card h-24 animate-pulse bg-parchment-dark" />
                ))}
              </div>
            ) : prestamos.length === 0 ? (
              <div className="card flex flex-col items-center py-12 text-center">
                <BookOpen className="mb-3 h-8 w-8 text-ink/20" />
                <p className="font-body text-sm text-ink-muted">No tienes préstamos activos</p>
                <Link href="/search" className="btn-secondary mt-4 px-4 py-2 text-sm">
                  Explorar catálogo
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {prestamos.map((prestamo) => {
                  const diasRestantes = diasHasta(prestamo.dueDate);
                  const esVencido = prestamo.status === 'overdue' || diasRestantes < 0;
                  // Construir URL de portada desde ISBN si está en el barcode
                  const coverUrl = `https://covers.openlibrary.org/b/isbn/${prestamo.itemId.replace('EJ', '')}-M.jpg`;

                  return (
                    <div
                      key={prestamo.id}
                      className={`card flex items-center gap-4 p-4 ${esVencido ? 'border-rust/20 bg-rust/3' : ''}`}
                    >
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-sm bg-parchment-dark">
                        <BookOpen className="absolute inset-0 m-auto h-6 w-6 text-ink/20" />
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
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono text-xs font-medium ${esVencido ? 'text-rust' : 'text-ink-muted'}`}>
                          {esVencido
                            ? `Vencido hace ${Math.abs(diasRestantes)} días`
                            : `Vence en ${diasRestantes} días`}
                        </p>
                        <p className="font-mono text-xs text-ink-muted mt-0.5">
                          {new Date(prestamo.dueDate).toLocaleDateString('es-CO')}
                        </p>
                        {prestamo.fineAmount > 0 && (
                          <p className="font-mono text-xs text-rust mt-1">
                            Multa: ${prestamo.fineAmount.toFixed(2)}
                          </p>
                        )}
                        {!esVencido && (
                          <button className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-amber-book hover:underline">
                            <RefreshCw className="h-3 w-3" />
                            Renovar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Sin sesión: acceso rápido */}
          {!usuario && (
            <section className="rounded-sm border border-amber-book/20 bg-amber-book/5 p-6 text-center">
              <p className="font-body text-sm text-ink">
                Inicia sesión para ver tus préstamos personalizados
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/login" className="btn-amber px-5 py-2 text-sm">
                  Iniciar sesión
                </Link>
                <Link href="/register" className="btn-secondary px-5 py-2 text-sm">
                  Registrarme
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
