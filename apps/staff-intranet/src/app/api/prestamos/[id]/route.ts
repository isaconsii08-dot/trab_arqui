import { NextRequest, NextResponse } from 'next/server';

const PORTAL_URL = process.env.PATRON_PORTAL_URL ?? 'http://localhost:4000';
const BASE_URL   = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:4001';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json() as { estado?: string; notas?: string };

    // 1. Si se está marcando como entregada, primero obtenemos los datos de la solicitud
    //    para poder crear el préstamo real en circulación.
    if (body.estado === 'entregada') {
      const solicitudRes = await fetch(`${PORTAL_URL}/api/prestamos`);
      if (solicitudRes.ok) {
        const lista = await solicitudRes.json() as Array<{
          id: string;
          itemBarcode?: string;
          cardNumber?: string;
          estado: string;
        }>;
        const solicitud = lista.find((s) => s.id === id);

        if (solicitud?.itemBarcode && solicitud?.cardNumber) {
          // 2. Crear el préstamo real en la capa de circulación
          await fetch(`${BASE_URL}/api/circulacion/loan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemBarcode: solicitud.itemBarcode,
              patronCardNumber: solicitud.cardNumber,
            }),
          }).catch(() => {/* no bloquear si falla */});
        }
      }
    }

    // 3. Actualizar el estado de la solicitud en el portal de socios
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
