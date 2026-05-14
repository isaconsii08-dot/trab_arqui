import { NextRequest, NextResponse } from 'next/server';

// Salas base (mismas que en el frontend — fuente de verdad para admin)
const SALAS_BASE = [
  { id: 's1', nombre: 'Sala de estudio A',   capacidad: 8,  planta: 'Planta 1', horarioInicio: 7,  horarioFin: 22 },
  { id: 's2', nombre: 'Sala de estudio B',   capacidad: 6,  planta: 'Planta 1', horarioInicio: 7,  horarioFin: 22 },
  { id: 's3', nombre: 'Sala de grupos C',    capacidad: 12, planta: 'Planta 2', horarioInicio: 8,  horarioFin: 20 },
  { id: 's4', nombre: 'Cabina de lectura 1', capacidad: 2,  planta: 'Planta 2', horarioInicio: 7,  horarioFin: 22 },
  { id: 's5', nombre: 'Cabina de lectura 2', capacidad: 2,  planta: 'Planta 2', horarioInicio: 7,  horarioFin: 22 },
  { id: 's6', nombre: 'Sala multimedia',     capacidad: 10, planta: 'Planta 3', horarioInicio: 8,  horarioFin: 18 },
];

declare global {
  // eslint-disable-next-line no-var
  var __salasReservas: import('../route').Reserva[] | undefined;
  // eslint-disable-next-line no-var
  var __salasConfig: import('../route').SalaConfig[] | undefined;
}

function getStore() {
  if (!global.__salasReservas) global.__salasReservas = [];
  if (!global.__salasConfig) global.__salasConfig = [];
  return { store: global.__salasReservas, config: global.__salasConfig };
}

function isSalaActiva(salaId: string, config: import('../route').SalaConfig[]): boolean {
  const cfg = config.find((c) => c.id === salaId);
  return cfg ? cfg.activa : true;
}

// ─── GET /api/salas/admin ──────────────────────────────────────────────────────
// Devuelve todas las reservas de hoy + estado de cada sala con su config

export async function GET() {
  const { store, config } = getStore();

  const hoy = new Date().toISOString().slice(0, 10);
  const hora = new Date().getHours();

  // Limpiar anteriores
  store.splice(0, store.length, ...store.filter((r) => r.fecha >= hoy));

  const reservasHoy = store.filter((r) => r.fecha === hoy);

  const salas = SALAS_BASE.map((sala) => ({
    ...sala,
    activa: isSalaActiva(sala.id, config),
    reservasHoy: reservasHoy
      .filter((r) => r.salaId === sala.id)
      .sort((a, b) => a.startHour - b.startHour),
    enUsoAhora: reservasHoy.some(
      (r) => r.salaId === sala.id && r.startHour <= hora && hora < r.endHour,
    ),
  }));

  return NextResponse.json({
    salas,
    totalReservasHoy: reservasHoy.length,
    horaActual: hora,
    fecha: hoy,
  });
}

// ─── PATCH /api/salas/admin ────────────────────────────────────────────────────
// Activar o desactivar una sala: { salaId, activa }

export async function PATCH(req: NextRequest) {
  const { store: _s, config } = getStore();
  const body = await req.json() as { salaId: string; activa: boolean };
  const { salaId, activa } = body;

  if (!salaId || activa === undefined) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  const idx = config.findIndex((c) => c.id === salaId);
  if (idx === -1) {
    config.push({ id: salaId, activa });
  } else {
    config[idx]!.activa = activa;
  }

  return NextResponse.json({ ok: true, salaId, activa });
}

// ─── DELETE /api/salas/admin ───────────────────────────────────────────────────
// Admin cancela una reserva por ID (sin validar sessionId)

export async function DELETE(req: NextRequest) {
  const { store } = getStore();
  const body = await req.json() as { reservaId: string };
  const { reservaId } = body;

  if (!reservaId) {
    return NextResponse.json({ error: 'reservaId requerido' }, { status: 400 });
  }

  const idx = store.findIndex((r) => r.id === reservaId);
  if (idx === -1) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }

  store.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}
