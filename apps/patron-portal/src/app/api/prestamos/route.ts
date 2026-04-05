import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export interface SolicitudPrestamo {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada';
  creadaEn: string;
  notas?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __solicitudesPrestamo: SolicitudPrestamo[] | undefined;
}

export function getSolicitudes(): SolicitudPrestamo[] {
  if (!global.__solicitudesPrestamo) global.__solicitudesPrestamo = [];
  return global.__solicitudesPrestamo;
}

export async function GET() {
  return NextResponse.json(getSolicitudes());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Partial<SolicitudPrestamo>;
  if (!body.bookId || !body.userName) {
    return NextResponse.json({ message: 'Faltan datos' }, { status: 400 });
  }
  const solicitud: SolicitudPrestamo = {
    id: randomUUID(),
    bookId: body.bookId,
    bookTitle: body.bookTitle ?? body.bookId,
    userId: body.userId ?? 'unknown',
    userName: body.userName,
    estado: 'pendiente',
    creadaEn: new Date().toISOString(),
  };
  getSolicitudes().unshift(solicitud);
  return NextResponse.json(solicitud, { status: 201 });
}
