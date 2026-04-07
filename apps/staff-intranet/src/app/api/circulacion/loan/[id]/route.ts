import { NextRequest, NextResponse } from 'next/server';
import { obtenerTokenServicio } from '@/lib/api';

const CIRC_URL = process.env.CIRC_SERVICE_URL ?? 'http://localhost:3004';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await obtenerTokenServicio();
  const res = await fetch(`${CIRC_URL}/api/v1/circulation/loans/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await obtenerTokenServicio();
  const body = await req.json() as unknown;
  const res = await fetch(`${CIRC_URL}/api/v1/circulation/loans/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await obtenerTokenServicio();
  const res = await fetch(`${CIRC_URL}/api/v1/circulation/loans/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
