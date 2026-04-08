import { NextRequest, NextResponse } from 'next/server';

const PORTAL_URL = process.env.PATRON_PORTAL_URL ?? 'http://localhost:4000';
const BASE_URL   = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:4001';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json() as { estado?: string; notas?: string };

    // Actualizar el estado de la solicitud en el portal de socios
    const res = await fetch(`${PORTAL_URL}/api/prestamos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
