import { NextRequest, NextResponse } from 'next/server';
import { obtenerCredencialesServicio } from '@/lib/api';

const CIRC_URL = process.env.CIRC_SERVICE_URL ?? 'http://localhost:3004';

export async function POST(req: NextRequest) {
  try {
    const { itemBarcode, patronCardNumber } = await req.json() as {
      itemBarcode: string;
      patronCardNumber: string;
    };

    const { token, staffId, libraryId } = await obtenerCredencialesServicio();

    const res = await fetch(`${CIRC_URL}/api/v1/circulation/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemBarcode, patronCardNumber, staffId, libraryId }),
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
