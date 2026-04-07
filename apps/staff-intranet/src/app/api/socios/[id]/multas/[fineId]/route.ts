import { NextRequest, NextResponse } from 'next/server';
import { obtenerTokenServicio } from '@/lib/api';

const PATRON_URL = process.env.PATRON_SERVICE_URL ?? 'http://localhost:3001';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; fineId: string }> }) {
  const { id, fineId } = await params;
  const token = await obtenerTokenServicio();
  const body = await req.json() as unknown;
  const res = await fetch(`${PATRON_URL}/api/v1/patrons/${id}/fines/${fineId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
