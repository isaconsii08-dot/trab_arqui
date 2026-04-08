import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PATRON_URL = process.env.PATRON_SERVICE_URL ?? 'http://localhost:3001';
const CIRC_URL   = process.env.CIRC_SERVICE_URL   ?? 'http://localhost:3004';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('bf_token')?.value;
  const userRaw = cookieStore.get('bf_user')?.value;
  if (!token || !userRaw) return NextResponse.json({ fines: [], total: 0 });

  try {
    const user = JSON.parse(decodeURIComponent(userRaw)) as { sub?: string; id?: string };
    const patronId = user.sub ?? user.id ?? '';
    if (!patronId) return NextResponse.json({ fines: [], total: 0 });

    const res = await fetch(`${PATRON_URL}/api/v1/patrons/${patronId}/fines`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ fines: [], total: 0 });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ fines: [], total: 0 });
  }
}

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('bf_token')?.value;
  const userRaw = cookieStore.get('bf_user')?.value;
  if (!token || !userRaw) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const user = JSON.parse(decodeURIComponent(userRaw)) as { sub?: string; id?: string };
    const patronId = user.sub ?? user.id ?? '';
    if (!patronId) return NextResponse.json({ error: 'Sin patronId' }, { status: 400 });

    // 1. Obtener multas pendientes antes de pagar para conocer los loanIds afectados
    const finesRes = await fetch(`${PATRON_URL}/api/v1/patrons/${patronId}/fines`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const finesData = finesRes.ok
      ? (await finesRes.json() as { fines?: Array<{ loanId?: string }> })
      : { fines: [] };
    const loanIds = [...new Set(
      (finesData.fines ?? []).map((f) => f.loanId).filter(Boolean) as string[],
    )];

    // 2. Saldar todas las multas en el patron-service
    const payRes = await fetch(`${PATRON_URL}/api/v1/patrons/${patronId}/fines/pay-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payData = await payRes.json() as unknown;

    // 3. Limpiar fineAmount en el circulation-service para cada préstamo afectado
    //    (no bloqueante: si falla no cancela el pago ya registrado)
    if (loanIds.length > 0) {
      await Promise.allSettled(
        loanIds.map((loanId) =>
          fetch(`${CIRC_URL}/api/v1/circulation/loans/${loanId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fineAmount: 0 }),
          }),
        ),
      );
    }

    return NextResponse.json(payData, { status: payRes.status });
  } catch {
    return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 });
  }
}
