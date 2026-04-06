'use client';

import { MapPin, Clock, Users, Wifi, X, CheckCircle, CalendarCheck, AlertTriangle, RefreshCw, BookOpen } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import { useState, useEffect, useCallback } from 'react';

// ─── Datos base de salas (todas disponibles a priori) ─────────────────────────

const SALAS = [
  {
    id: 's1',
    nombre: 'Sala de estudio A',
    capacidad: 8,
    planta: 'Planta 1',
    wifi: true,
    horario: '07:00 – 22:00',
    horarioInicio: 7,
    horarioFin: 22,
    descripcion: 'Sala silenciosa con 8 puestos. Ideal para trabajo individual o grupos pequeños.',
  },
  {
    id: 's2',
    nombre: 'Sala de estudio B',
    capacidad: 6,
    planta: 'Planta 1',
    wifi: true,
    horario: '07:00 – 22:00',
    horarioInicio: 7,
    horarioFin: 22,
    descripcion: 'Sala con pantalla de proyección. Disponible para grupos de estudio.',
  },
  {
    id: 's3',
    nombre: 'Sala de grupos C',
    capacidad: 12,
    planta: 'Planta 2',
    wifi: true,
    horario: '08:00 – 20:00',
    horarioInicio: 8,
    horarioFin: 20,
    descripcion: 'Sala amplia para grupos de trabajo. Incluye pizarrón y proyector.',
  },
  {
    id: 's4',
    nombre: 'Cabina de lectura 1',
    capacidad: 2,
    planta: 'Planta 2',
    wifi: false,
    horario: '07:00 – 22:00',
    horarioInicio: 7,
    horarioFin: 22,
    descripcion: 'Cabina privada para lectura o estudio individual. Ambiente silencioso.',
  },
  {
    id: 's5',
    nombre: 'Cabina de lectura 2',
    capacidad: 2,
    planta: 'Planta 2',
    wifi: false,
    horario: '07:00 – 22:00',
    horarioInicio: 7,
    horarioFin: 22,
    descripcion: 'Cabina privada para lectura o estudio individual. Ambiente silencioso.',
  },
  {
    id: 's6',
    nombre: 'Sala multimedia',
    capacidad: 10,
    planta: 'Planta 3',
    wifi: true,
    horario: '08:00 – 18:00',
    horarioInicio: 8,
    horarioFin: 18,
    descripcion: 'Equipada con computadores y acceso a bases de datos especializadas.',
  },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Reserva {
  id: string;
  salaId: string;
  salaNombre: string;
  userName: string;
  sessionId: string;
  fecha: string;
  startHour: number;
  endHour: number;
  creadaEn: string;
}

interface EstadoSalas {
  reservas: Reserva[];
  ocupadas: string[];     // IDs de salas ocupadas EN ESTE MOMENTO
  desactivadas: string[]; // IDs de salas deshabilitadas por admin
  horaActual: number;
  fecha: string;
}

// ─── Hook de sesión de usuario ────────────────────────────────────────────────

function useSession(): { userName: string; sessionId: string; isLoggedIn: boolean } {
  const [sessionId, setSessionId] = useState('');
  const [userName, setUserName] = useState('Visitante');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const hasToken = document.cookie.split('; ').some((r) => r.startsWith('bf_token='));
    setIsLoggedIn(hasToken);

    // Obtener o generar sessionId persistente en localStorage
    let sid = localStorage.getItem('bf_session_id');
    if (!sid) {
      sid = Math.random().toString(36).slice(2, 10).toUpperCase();
      localStorage.setItem('bf_session_id', sid);
    }
    setSessionId(sid);

    // Nombre desde cookie de sesión si existe
    const userCookie = document.cookie.split('; ').find((r) => r.startsWith('bf_user='));
    if (userCookie) {
      try {
        const u = JSON.parse(decodeURIComponent(userCookie.split('=').slice(1).join('='))) as { fullName?: string };
        if (u.fullName) setUserName(u.fullName.split(' ')[0]!);
      } catch { /* ignorar */ }
    }
  }, []);

  return { userName, sessionId, isLoggedIn };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SpacesPage() {
  const { userName, sessionId, isLoggedIn } = useSession();
  const [estado, setEstado] = useState<EstadoSalas>({ reservas: [], ocupadas: [], desactivadas: [], horaActual: new Date().getHours(), fecha: '' });
  const [salaModal, setSalaModal] = useState<typeof SALAS[0] | null>(null);
  const [startHour, setStartHour] = useState(10);
  const [duracion, setDuracion] = useState(2);
  const [reservando, setReservando] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  const mostrarToast = (msg: string, tipo: 'ok' | 'err') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 5000);
  };

  // ─── Cargar estado desde el servidor ──────────────────────────────────────

  const cargarEstado = useCallback(async () => {
    try {
      const res = await fetch('/api/salas', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json() as EstadoSalas;
        setEstado(data);
      }
    } catch { /* ignorar */ }
  }, []);

  useEffect(() => {
    cargarEstado();
    const interval = setInterval(cargarEstado, 5000); // polling cada 5 s
    return () => clearInterval(interval);
  }, [cargarEstado]);

  // ─── Reservar sala ─────────────────────────────────────────────────────────

  const confirmarReserva = async () => {
    if (!salaModal || !sessionId) return;
    setReservando(true);
    setErrorModal('');

    try {
      const res = await fetch('/api/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salaId: salaModal.id,
          salaNombre: salaModal.nombre,
          userName,
          sessionId,
          startHour,
          durationHours: duracion,
        }),
      });

      const data = await res.json() as { reserva?: Reserva; mensaje?: string; error?: string };

      if (!res.ok) {
        setErrorModal(data.mensaje ?? data.error ?? 'No se pudo reservar');
        return;
      }

      setSalaModal(null);
      setErrorModal('');
      mostrarToast(`¡${salaModal.nombre} reservada de ${startHour}:00 a ${startHour + duracion}:00!`, 'ok');
      await cargarEstado();
    } catch {
      setErrorModal('Error de conexión');
    } finally {
      setReservando(false);
    }
  };

  // ─── Cancelar reserva ──────────────────────────────────────────────────────

  const cancelarReserva = async (reservaId: string) => {
    setCancelando(reservaId);
    try {
      const res = await fetch(`/api/salas/${reservaId}?sessionId=${sessionId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        mostrarToast('Reserva cancelada correctamente', 'ok');
        await cargarEstado();
      } else {
        mostrarToast('No se pudo cancelar la reserva', 'err');
      }
    } catch {
      mostrarToast('Error de conexión', 'err');
    } finally {
      setCancelando(null);
    }
  };

  // ─── Calcular horas disponibles para una sala ──────────────────────────────

  const horasOcupadas = (salaId: string): number[][] => {
    return estado.reservas
      .filter((r) => r.salaId === salaId)
      .map((r) => [r.startHour, r.endHour]);
  };

  const slotDisponible = (salaId: string, start: number, dur: number): boolean => {
    const end = start + dur;
    return !estado.reservas.some(
      (r) => r.salaId === salaId && !(end <= r.startHour || start >= r.endHour),
    );
  };

  const misReservas = estado.reservas.filter((r) => r.sessionId === sessionId);
  const disponibles = SALAS.filter((s) => !estado.ocupadas.includes(s.id) && !estado.desactivadas.includes(s.id)).length;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-5xl px-6 py-10">

          {/* Encabezado */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <span className="section-label">Biblioteca UCC</span>
              <h1 className="heading-md mt-2 text-ink">Salas y espacios</h1>
              <p className="mt-1 font-body text-sm text-ink-muted">
                <span className="font-medium text-emerald-library">{disponibles}</span> de {SALAS.length} espacios libres ahora
                {estado.horaActual > 0 && (
                  <span className="ml-2 font-mono text-xs text-ink-muted">· {String(estado.horaActual).padStart(2,'0')}:00</span>
                )}
              </p>
            </div>
            <button
              onClick={cargarEstado}
              className="flex items-center gap-1.5 font-mono text-xs text-ink-muted hover:text-ink"
              title="Actualizar disponibilidad"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Actualizar
            </button>
          </div>

          {/* Muro de autenticación */}
          {!isLoggedIn && sessionId && (
            <div className="mb-6 rounded-sm border border-amber-book/30 bg-amber-book/5 p-8 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-amber-book/50" />
              <p className="font-display text-base font-semibold text-ink">Inicia sesión para reservar</p>
              <p className="mt-1 font-body text-sm text-ink-muted">
                Necesitas una cuenta de socio para reservar salas y espacios.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <a href="/login?redirect=/spaces" className="btn-amber text-sm px-5 py-2">Iniciar sesión</a>
                <a href="/register" className="btn-secondary text-sm px-5 py-2">Registrarme</a>
              </div>
            </div>
          )}

          {/* Mis reservas activas */}
          {misReservas.length > 0 && (
            <div className="mb-6 rounded-sm border border-emerald-library/20 bg-emerald-library/5 p-4">
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink">
                <CalendarCheck className="h-4 w-4 text-emerald-library" />
                Mis reservas de hoy
              </h2>
              <div className="space-y-2">
                {misReservas.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-sm bg-white/60 px-3 py-2">
                    <div>
                      <p className="font-body text-sm font-medium text-ink">{r.salaNombre}</p>
                      <p className="font-mono text-xs text-ink-muted">
                        {String(r.startHour).padStart(2,'0')}:00 – {String(r.endHour).padStart(2,'0')}:00
                        {estado.ocupadas.includes(r.salaId) && (
                          <span className="ml-2 text-amber-book">· En uso ahora</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => cancelarReserva(r.id)}
                      disabled={cancelando === r.id}
                      className="font-mono text-xs text-rust hover:underline disabled:opacity-50"
                    >
                      {cancelando === r.id ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarjetas de salas */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SALAS.map((sala) => {
              const enUsoAhora = estado.ocupadas.includes(sala.id);
              const desactivada = estado.desactivadas.includes(sala.id);
              const miReserva = misReservas.find((r) => r.salaId === sala.id);
              const reservasHoy = estado.reservas.filter((r) => r.salaId === sala.id);
              const otraPersonaOcupa = enUsoAhora && !miReserva;
              const quienOcupa = otraPersonaOcupa
                ? estado.reservas.find(
                    (r) =>
                      r.salaId === sala.id &&
                      r.startHour <= estado.horaActual &&
                      estado.horaActual < r.endHour,
                  )
                : null;

              let estadoLabel = 'Disponible';
              let estadoColor = 'bg-emerald-library/10 text-emerald-library';

              if (desactivada) {
                estadoLabel = 'No disponible';
                estadoColor = 'bg-ink/10 text-ink-muted';
              } else if (miReserva && enUsoAhora) {
                estadoLabel = 'Tu reserva activa';
                estadoColor = 'bg-amber-book/10 text-amber-book';
              } else if (miReserva) {
                estadoLabel = 'Reservada por ti';
                estadoColor = 'bg-amber-book/10 text-amber-book';
              } else if (otraPersonaOcupa) {
                estadoLabel = 'En uso';
                estadoColor = 'bg-rust/10 text-rust';
              }

              return (
                <div key={sala.id} className={`card flex flex-col p-5 ${(otraPersonaOcupa || desactivada) ? 'opacity-75' : ''}`}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h2 className="font-display text-base font-semibold text-ink leading-snug">{sala.nombre}</h2>
                    <span className={`shrink-0 rounded-sm px-2 py-0.5 font-mono text-xs font-medium ${estadoColor}`}>
                      {estadoLabel}
                    </span>
                  </div>

                  <p className="mb-4 font-body text-sm text-ink-muted">{sala.descripcion}</p>

                  <div className="space-y-1.5 text-xs text-ink-muted">
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /><span>{sala.planta}</span></div>
                    <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 shrink-0" /><span>Hasta {sala.capacidad} personas</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0" /><span>{sala.horario}</span></div>
                    {sala.wifi && <div className="flex items-center gap-2"><Wifi className="h-3.5 w-3.5 shrink-0" /><span>WiFi disponible</span></div>}
                  </div>

                  {/* Quién la tiene reservada ahora */}
                  {quienOcupa && (
                    <p className="mt-3 font-mono text-xs text-rust/70">
                      En uso por {quienOcupa.userName} hasta las {String(quienOcupa.endHour).padStart(2,'0')}:00
                    </p>
                  )}

                  {/* Próximas reservas (de otras personas) */}
                  {reservasHoy.filter((r) => r.sessionId !== sessionId && r.startHour > estado.horaActual).length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-mono text-xs text-ink-muted">Próximas reservas:</p>
                      {reservasHoy
                        .filter((r) => r.sessionId !== sessionId && r.startHour > estado.horaActual)
                        .sort((a, b) => a.startHour - b.startHour)
                        .map((r) => (
                          <p key={r.id} className="font-mono text-xs text-ink-muted">
                            {String(r.startHour).padStart(2,'0')}:00–{String(r.endHour).padStart(2,'0')}:00 · {r.userName}
                          </p>
                        ))}
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    {!isLoggedIn ? (
                      <a
                        href="/login?redirect=/spaces"
                        className="flex w-full items-center justify-center rounded-sm border border-amber-book/30 py-2 font-mono text-xs text-amber-book hover:bg-amber-book/5"
                      >
                        Inicia sesión para reservar
                      </a>
                    ) : desactivada ? (
                      <div className="w-full rounded-sm bg-ink/5 py-2 text-center font-mono text-xs text-ink-muted">
                        Temporalmente no disponible
                      </div>
                    ) : miReserva ? (
                      <button
                        onClick={() => cancelarReserva(miReserva.id)}
                        disabled={cancelando === miReserva.id}
                        className="w-full rounded-sm border border-rust/30 py-2 font-mono text-xs text-rust hover:bg-rust/5 disabled:opacity-50"
                      >
                        {cancelando === miReserva.id ? 'Cancelando...' : 'Cancelar mi reserva'}
                      </button>
                    ) : otraPersonaOcupa ? (
                      <button
                        onClick={() => { setSalaModal(sala); setErrorModal(''); setStartHour(sala.horarioInicio); setDuracion(2); }}
                        className="w-full rounded-sm border border-ink/15 py-2 font-mono text-xs text-ink-muted hover:border-amber-book/40 hover:text-ink"
                      >
                        Ver horarios disponibles
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSalaModal(sala); setErrorModal(''); setStartHour(sala.horarioInicio); setDuracion(2); }}
                        className="btn-amber w-full justify-center text-sm"
                      >
                        Reservar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-sm border border-ink/8 bg-parchment-light p-4 font-body text-sm text-ink-muted">
            <strong className="text-ink">Horario de atención:</strong> Lunes a viernes 7:00–22:00 · Sábados 8:00–16:00
            <span className="ml-3 font-mono text-xs">· Las reservas son para el día de hoy y se actualizan en tiempo real.</span>
          </div>
        </div>
      </div>

      {/* ─── Modal de reserva ────────────────────────────────────────────────── */}
      {salaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-sm border border-ink/10 bg-parchment p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Reservar {salaModal.nombre}</h2>
              <button onClick={() => setSalaModal(null)} className="text-ink-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorModal && (
              <div className="mb-3 flex items-start gap-2 rounded-sm border border-rust/30 bg-rust/5 px-3 py-2 font-body text-sm text-rust">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {errorModal}
              </div>
            )}

            <div className="space-y-4">
              {/* Selector de hora */}
              <div>
                <label className="mb-2 block font-body text-sm font-medium text-ink">Hora de entrada</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: salaModal.horarioFin - salaModal.horarioInicio }, (_, i) => {
                    const h = salaModal.horarioInicio + i;
                    const ocupado = !slotDisponible(salaModal.id, h, duracion);
                    const sel = h === startHour;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => !ocupado && setStartHour(h)}
                        disabled={ocupado || h + duracion > salaModal.horarioFin}
                        className={`rounded-sm py-1.5 font-mono text-xs transition-colors ${
                          sel
                            ? 'bg-amber-book text-white'
                            : ocupado
                            ? 'bg-rust/10 text-rust/50 line-through cursor-not-allowed'
                            : h + duracion > salaModal.horarioFin
                            ? 'bg-ink/5 text-ink-muted/40 cursor-not-allowed'
                            : 'border border-ink/15 text-ink hover:border-amber-book/40'
                        }`}
                      >
                        {String(h).padStart(2,'0')}:00
                      </button>
                    );
                  })}
                </div>
                {horasOcupadas(salaModal.id).length > 0 && (
                  <p className="mt-1.5 font-mono text-xs text-rust/70">
                    Tachadas = ya reservadas
                  </p>
                )}
              </div>

              {/* Duración */}
              <div>
                <label className="mb-2 block font-body text-sm font-medium text-ink">Duración</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuracion(d)}
                      disabled={startHour + d > salaModal.horarioFin}
                      className={`flex-1 rounded-sm py-2 font-mono text-xs transition-colors ${
                        duracion === d
                          ? 'bg-amber-book text-white'
                          : startHour + d > salaModal.horarioFin
                          ? 'border border-ink/10 text-ink-muted/40 cursor-not-allowed'
                          : 'border border-ink/15 text-ink hover:border-amber-book/40'
                      }`}
                    >
                      {d}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="mt-4 rounded-sm bg-parchment-dark p-3">
              <p className="font-body text-sm text-ink">
                <span className="font-medium">{salaModal.nombre}</span>
                <span className="text-ink-muted"> · </span>
                {String(startHour).padStart(2,'0')}:00 – {String(startHour + duracion).padStart(2,'0')}:00
                <span className="text-ink-muted"> · {salaModal.planta}</span>
              </p>
              <p className="mt-0.5 font-mono text-xs text-ink-muted">
                Reservando como: <span className="text-ink">{userName}</span>
              </p>
            </div>

            <button
              onClick={confirmarReserva}
              disabled={reservando || !slotDisponible(salaModal.id, startHour, duracion)}
              className="btn-amber mt-5 w-full justify-center disabled:opacity-50"
            >
              {reservando ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Reservando...
                </span>
              ) : !slotDisponible(salaModal.id, startHour, duracion) ? (
                'Horario no disponible'
              ) : (
                'Confirmar reserva'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-sm border px-5 py-3 shadow-lg font-body text-sm max-w-sm ${toast.tipo === 'ok' ? 'border-emerald-library/30 bg-emerald-library/10 text-emerald-library' : 'border-rust/30 bg-rust/5 text-rust'}`}>
          {toast.tipo === 'ok'
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
