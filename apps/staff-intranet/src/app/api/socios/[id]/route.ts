import { NextRequest, NextResponse } from 'next/server';
import { obtenerCredencialesServicio } from '@/lib/api';

const PATRON_URL = process.env.PATRON_SERVICE_URL ?? 'http://localhost:3001';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { token } = await obtenerCredencialesServicio();
    const res = await fetch(`${PATRON_URL}/api/v1/patrons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json() as unknown;
    const { token } = await obtenerCredencialesServicio();
    const res = await fetch(`${PATRON_URL}/api/v1/patrons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { token } = await obtenerCredencialesServicio();
    const res = await fetch(`${PATRON_URL}/api/v1/patrons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
