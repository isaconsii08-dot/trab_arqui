import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CIRC_URL = process.env.CIRC_SERVICE_URL ?? 'http://localhost:3004';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('bf_token')?.value;
  const userRaw = cookieStore.get('bf_user')?.value;

  if (!token || !userRaw) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  }

  let patronId: string;
  try {
    const user = JSON.parse(decodeURIComponent(userRaw)) as { sub?: string; id?: string };
    patronId = user.sub ?? user.id ?? '';
  } catch {
    return NextResponse.json({ data: [], total: 0 });
  }

  if (!patronId) return NextResponse.json({ data: [], total: 0 });

  try {
    const res = await fetch(
      `${CIRC_URL}/api/v1/circulation/loans/patron/${patronId}?page=1&limit=50`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ data: [], total: 0 });
    const data = await res.json() as { data: unknown[]; total: number };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ data: [], total: 0 });
  }
}
