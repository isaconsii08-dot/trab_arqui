import { NextRequest, NextResponse } from 'next/server';
import { obtenerCredencialesServicio } from '@/lib/api';



const CATALOG_URL = process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3002';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const { token } = await obtenerCredencialesServicio();
    const res = await fetch(`${CATALOG_URL}/api/v1/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
