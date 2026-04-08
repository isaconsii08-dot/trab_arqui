import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PATRON_URL = process.env.PATRON_SERVICE_URL ?? 'http://localhost:3001';

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

    const res = await fetch(`${PATRON_URL}/api/v1/patrons/${patronId}/fines/pay-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 });
  }
}
