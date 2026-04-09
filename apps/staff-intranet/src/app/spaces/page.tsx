'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapPin, Users, Clock, CheckCircle, XCircle, CalendarX, RefreshCw, Power, AlertTriangle, X } from 'lucide-react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

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

interface Sala {
  id: string;
  nombre: string;
  capacidad: number;
  planta: string;
  horarioInicio: number;
  horarioFin: number;
  activa: boolean;
  enUsoAhora: boolean;
  reservasHoy: Reserva[];
}

interface AdminData {
  salas: Sala[];
  totalReservasHoy: number;
  horaActual: number;
  fecha: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SalasAdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [accionando, setAccionando] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);
  const [confirmarCancelar, setConfirmarCancelar] = useState<Reserva | null>(null);

  const mostrarToast = (msg: string, tipo: 'ok' | 'err') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/salas', { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json() as AdminData;
        setData(d);
      }
    } catch { /* ignorar */ } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 10000);
    return () => clearInterval(interval);
  }, [cargar]);

  // Activar / desactivar sala
  const toggleSala = async (salaId: string, activarAhora: boolean) => {
    setAccionando(salaId);
    try {
      const res = await fetch('/api/salas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salaId, activa: activarAhora }),
      });
      if (res.ok) {
        mostrarToast(
          activarAhora ? 'Sala habilitada correctamente' : 'Sala deshabilitada correctamente',
          'ok',
        );
        await cargar();
      } else {
        mostrarToast('No se pudo cambiar el estado', 'err');
      }
    } catch {
      mostrarToast('Error de conexión', 'err');
    } finally {
      setAccionando(null);
    }
  };

  // Cancelar reserva (admin)
  const cancelarReserva = async (reservaId: string) => {
    setCancelando(reservaId);
    setConfirmarCancelar(null);
    try {
      const res = await fetch('/api/salas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId }),
      });
      if (res.ok || res.status === 204) {
        mostrarToast('Reserva cancelada correctamente', 'ok');
        await cargar();
      } else {
        mostrarToast('No se pudo cancelar', 'err');
      }
    } catch {
      mostrarToast('Error de conexión', 'err');
    } finally {
      setCancelando(null);
    }
  };

  if (cargando) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-xl font-semibold text-text-primary">Gestión de salas</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 animate-pulse rounded-sm bg-surface-raised" />
          ))}
        </div>
      </div>
    );
  }

  const totalReservas = data?.totalReservasHoy ?? 0;
  const salasActivas = data?.salas.filter((s) => s.activa).length ?? 0;
  const salasEnUso = data?.salas.filter((s) => s.enUsoAhora).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Gestión de salas</h1>
          <p className="font-mono text-xs text-text-muted">
            {data?.fecha} · {String(data?.horaActual ?? 0).padStart(2, '0')}:00
          </p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-text-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Reservas hoy',    value: totalReservas,  icon: CalendarX,    color: 'text-accent-blue'  },
          { label: 'Salas en uso',    value: salasEnUso,     icon: Users,        color: 'text-accent-amber' },
          { label: 'Salas activas',   value: salasActivas,   icon: CheckCircle,  color: 'text-accent-green' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="surface-card p-4">
              <Icon className={`mb-2 h-5 w-5 ${m.color}`} />
              <div className="font-display text-2xl font-semibold text-text-primary">{m.value}</div>
              <div className="font-mono text-xs text-text-muted">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tarjetas de salas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(data?.salas ?? []).map((sala) => (
          <div
            key={sala.id}
            className={`surface-card overflow-hidden ${!sala.activa ? 'opacity-70' : ''}`}
          >
            {/* Cabecera */}
            <div className="flex items-start justify-between border-b border-surface-border px-4 py-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-text-primary">{sala.nombre}</h2>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-text-muted">
                  <MapPin className="h-3 w-3" /> {sala.planta}
                  <span>·</span>
                  <Users className="h-3 w-3" /> {sala.capacidad} pax
                  <span>·</span>
                  <Clock className="h-3 w-3" /> {sala.horarioInicio}–{sala.horarioFin}h
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {/* Badge estado */}
                {!sala.activa ? (
                  <span className="rounded-full bg-surface-raised px-2 py-0.5 font-mono text-xs text-text-muted">
                    Deshabilitada
                  </span>
                ) : sala.enUsoAhora ? (
                  <span className="rounded-full bg-accent-amber/10 px-2 py-0.5 font-mono text-xs text-accent-amber">
                    En uso ahora
                  </span>
                ) : (
                  <span className="rounded-full bg-accent-green/10 px-2 py-0.5 font-mono text-xs text-accent-green">
                    Disponible
                  </span>
                )}
                {/* Toggle activar/desactivar */}
                <button
                  onClick={() => toggleSala(sala.id, !sala.activa)}
                  disabled={accionando === sala.id}
                  title={sala.activa ? 'Deshabilitar sala' : 'Habilitar sala'}
                  className={`flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-xs transition-colors disabled:opacity-50 ${
                    sala.activa
                      ? 'border border-accent-red/30 text-accent-red hover:bg-accent-red/5'
                      : 'border border-accent-green/30 text-accent-green hover:bg-accent-green/5'
                  }`}
                >
                  <Power className="h-3 w-3" />
                  {accionando === sala.id ? '...' : sala.activa ? 'Deshabilitar' : 'Habilitar'}
                </button>
              </div>
            </div>

            {/* Reservas del día */}
            <div className="px-4 py-3">
              {sala.reservasHoy.length === 0 ? (
                <p className="font-mono text-xs text-text-muted">Sin reservas hoy</p>
              ) : (
                <div className="space-y-2">
                  <p className="font-mono text-xs font-medium text-text-muted">
                    Reservas hoy ({sala.reservasHoy.length})
                  </p>
                  {sala.reservasHoy.map((r) => {
                    const ahora = data?.horaActual ?? 0;
                    const activa = r.startHour <= ahora && ahora < r.endHour;
                    return (
                      <div
                        key={r.id}
                        className={`flex items-center justify-between rounded-sm px-3 py-2 ${
                          activa ? 'bg-accent-amber/8 border border-accent-amber/20' : 'bg-surface-raised'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-body text-xs font-medium text-text-primary">
                            {r.userName}
                            {activa && (
                              <span className="ml-1.5 font-mono text-[10px] text-accent-amber">· ahora</span>
                            )}
                          </p>
                          <p className="font-mono text-[10px] text-text-muted">
                            {String(r.startHour).padStart(2, '0')}:00 – {String(r.endHour).padStart(2, '0')}:00
                          </p>
                          <p className="font-mono text-[10px] text-text-muted truncate">
                            ID: {r.sessionId}
                          </p>
                        </div>
                        <button
                          onClick={() => setConfirmarCancelar(r)}
                          disabled={cancelando === r.id}
                          title="Cancelar reserva"
                          className="ml-2 shrink-0 rounded-sm p-1.5 text-text-muted transition-colors hover:bg-accent-red/10 hover:text-accent-red disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(accionando !== null || cancelando !== null) && (
        <LoadingOverlay label={accionando !== null ? 'Actualizando sala...' : 'Cancelando reserva...'} />
      )}

      {/* Modal confirmación cancelar */}
      {confirmarCancelar && (
        <div className="fixed inset-0 z-[9999] mt-0 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,13,18,0.80)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-sm border border-surface-border bg-surface-base p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-text-primary">Cancelar reserva</h3>
              <button onClick={() => setConfirmarCancelar(null)} className="text-text-muted hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 rounded-sm bg-surface-raised p-3 font-body text-sm text-text-secondary space-y-1">
              <p><span className="font-medium text-text-primary">Sala:</span> {confirmarCancelar.salaNombre}</p>
              <p><span className="font-medium text-text-primary">Usuario:</span> {confirmarCancelar.userName}</p>
              <p><span className="font-medium text-text-primary">Horario:</span> {String(confirmarCancelar.startHour).padStart(2,'0')}:00 – {String(confirmarCancelar.endHour).padStart(2,'0')}:00</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarCancelar(null)}
                className="btn-ghost flex-1 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => cancelarReserva(confirmarCancelar.id)}
                className="flex-1 rounded-sm bg-accent-red px-4 py-2 font-body text-sm font-medium text-white hover:bg-accent-red/90"
              >
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-sm border px-5 py-3 shadow-lg font-body text-sm ${
          toast.tipo === 'ok'
            ? 'border-accent-green/30 bg-accent-green/10 text-accent-green'
            : 'border-accent-red/30 bg-accent-red/5 text-accent-red'
        }`}>
          {toast.tipo === 'ok'
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
