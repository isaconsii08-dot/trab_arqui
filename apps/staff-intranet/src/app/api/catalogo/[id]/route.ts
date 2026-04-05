import { NextRequest, NextResponse } from 'next/server';
import { obtenerCredencialesServicio } from '@/lib/api';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const CATALOG_URL = process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3002';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(`${CATALOG_URL}/api/v1/catalog/${id}`, { cache: 'no-store' });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json() as unknown;
    const { token } = await obtenerCredencialesServicio();
    const res = await fetch(`${CATALOG_URL}/api/v1/catalog/${id}`, {
      method: 'PUT',
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
    const res = await fetch(`${CATALOG_URL}/api/v1/catalog/${id}`, {
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
