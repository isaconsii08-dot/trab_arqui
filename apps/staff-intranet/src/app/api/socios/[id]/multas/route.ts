import { NextRequest, NextResponse } from 'next/server';
import { obtenerTokenServicio } from '@/lib/api';

const PATRON_URL = process.env.PATRON_SERVICE_URL ?? 'http://localhost:3001';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await obtenerTokenServicio();
  const all = new URL(req.url).searchParams.get('all') ?? '0';
  const res = await fetch(`${PATRON_URL}/api/v1/patrons/${id}/fines?all=${all}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as unknown;
  const res = await fetch(`${PATRON_URL}/api/v1/patrons/${id}/fines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
