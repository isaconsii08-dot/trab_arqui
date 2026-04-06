import { NextRequest, NextResponse } from 'next/server';
import { obtenerCredencialesServicio } from '@/lib/api';
const CIRC_URL = process.env.CIRC_SERVICE_URL ?? 'http://127.0.0.1:3004';

export async function POST(req: NextRequest) {
  try {
    const { itemBarcode } = await req.json();

    const { token, staffId } = await obtenerCredencialesServicio();

    // Forzar UUID si staffId no tiene el formato correcto
    const validStaffId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(staffId)
      ? staffId
      : '00000000-0000-0000-0000-000000000001';

    const res = await fetch(`${CIRC_URL}/api/v1/circulation/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemBarcode, staffId: validStaffId }),
    });
    const data = await res.json() as unknown;

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ message: mensaje }, { status: 500 });
  }
}
