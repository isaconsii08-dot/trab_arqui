import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Reserva {
  id: string;
  salaId: string;
  salaNombre: string;
  userName: string;
  sessionId: string;
  fecha: string;      // YYYY-MM-DD
  startHour: number;  // ej: 9
  endHour: number;    // ej: 11
  creadaEn: string;
}

export interface SalaConfig {
  id: string;
  activa: boolean;   // si está desactivada no se pueden crear reservas
}

// ─── Almacén en memoria ───────────────────────────────────────────────────────
// Se reinicia al reiniciar el servidor Next.js. Suficiente para demo.

declare global {
  // eslint-disable-next-line no-var
  var __salasReservas: Reserva[] | undefined;
  // eslint-disable-next-line no-var
  var __salasConfig: SalaConfig[] | undefined;
}

if (!global.__salasReservas) global.__salasReservas = [];
if (!global.__salasConfig) global.__salasConfig = [];

const store: Reserva[] = global.__salasReservas;
const config: SalaConfig[] = global.__salasConfig;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function horaActual(): number {
  return new Date().getHours();
}

export function isSalaActiva(salaId: string): boolean {
  const cfg = config.find((c) => c.id === salaId);
  return cfg ? cfg.activa : true; // por defecto activa
}

function hayConflicto(
  salaId: string,
  fecha: string,
  startHour: number,
  endHour: number,
  excludeId?: string,
): boolean {
  return store.some(
    (r) =>
      r.salaId === salaId &&
      r.fecha === fecha &&
      r.id !== excludeId &&
      !(endHour <= r.startHour || startHour >= r.endHour),
  );
}

// Eliminar reservas de días anteriores
function limpiarAnteriores() {
  const hoy = fechaHoy();
  store.splice(0, store.length, ...store.filter((r) => r.fecha >= hoy));
}

// ─── GET /api/salas ───────────────────────────────────────────────────────────

export async function GET() {
  limpiarAnteriores();
  const hoy = fechaHoy();
  const hora = horaActual();

  const hoy_reservas = store.filter((r) => r.fecha === hoy);

  const ocupadas = new Set<string>(
    hoy_reservas
      .filter((r) => r.startHour <= hora && hora < r.endHour)
      .map((r) => r.salaId),
  );

  // IDs de salas desactivadas
  const desactivadas = config.filter((c) => !c.activa).map((c) => c.id);

  return NextResponse.json({
    reservas: hoy_reservas,
    ocupadas: [...ocupadas],
    desactivadas,
    horaActual: hora,
    fecha: hoy,
  });
}

// ─── POST /api/salas ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  limpiarAnteriores();

  const body = await req.json() as {
    salaId: string;
    salaNombre: string;
    userName: string;
    sessionId: string;
    startHour: number;
    durationHours: number;
  };

  const { salaId, salaNombre, userName, sessionId, startHour, durationHours } = body;

  if (!salaId || !sessionId || startHour == null || !durationHours) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  // Verificar que la sala esté activa
  if (!isSalaActiva(salaId)) {
    return NextResponse.json(
      { error: 'Sala no disponible', mensaje: 'Esta sala está temporalmente deshabilitada.' },
      { status: 409 },
    );
  }

  const endHour = startHour + durationHours;
  const fecha = fechaHoy();

  if (hayConflicto(salaId, fecha, startHour, endHour)) {
    const conflicto = store.find(
      (r) =>
        r.salaId === salaId &&
        r.fecha === fecha &&
        !(endHour <= r.startHour || startHour >= r.endHour),
    );
    return NextResponse.json(
      {
        error: 'Horario no disponible',
        mensaje: `Ese horario ya está reservado por ${conflicto?.userName ?? 'otro usuario'} (${conflicto?.startHour}:00–${conflicto?.endHour}:00)`,
      },
      { status: 409 },
    );
  }

  const yaReservada = store.find(
    (r) => r.salaId === salaId && r.fecha === fecha && r.sessionId === sessionId,
  );
  if (yaReservada) {
    return NextResponse.json(
      { error: 'Ya tienes una reserva', mensaje: 'Ya tienes una reserva activa para esta sala hoy.' },
      { status: 409 },
    );
  }

  const nueva: Reserva = {
    id: randomUUID(),
    salaId,
    salaNombre,
    userName: userName || 'Visitante',
    sessionId,
    fecha,
    startHour,
    endHour,
    creadaEn: new Date().toISOString(),
  };

  store.push(nueva);

  return NextResponse.json({ reserva: nueva }, { status: 201 });
}
