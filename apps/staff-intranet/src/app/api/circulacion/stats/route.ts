import { NextResponse } from 'next/server';
import { obtenerTokenServicio } from '@/lib/api';

const CIRC_URL = process.env.CIRC_SERVICE_URL ?? 'http://127.0.0.1:3004';

export async function GET() {
  try {
    const token = await obtenerTokenServicio();
    const res = await fetch(`${CIRC_URL}/api/v1/circulation/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ prestamosActivos: 0, prestamosVencidos: 0 });
    const data = await res.json() as { prestamosActivos?: number; prestamosVencidos?: number };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ prestamosActivos: 0, prestamosVencidos: 0 });
  }
}
