import { NextRequest, NextResponse } from 'next/server';

// Proxy al admin endpoint del portal del socio (port 4000)
const PORTAL_URL = process.env.PATRON_PORTAL_URL ?? 'http://localhost:4000';

export async function GET() {
  try {
    const res = await fetch(`${PORTAL_URL}/api/salas/admin`, { cache: 'no-store' });
    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

// Activar / desactivar sala
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const res = await fetch(`${PORTAL_URL}/api/salas/admin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

// Admin cancela reserva
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const res = await fetch(`${PORTAL_URL}/api/salas/admin`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
