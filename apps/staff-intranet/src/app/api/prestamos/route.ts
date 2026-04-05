import { NextResponse } from 'next/server';

const PORTAL_URL = process.env.PATRON_PORTAL_URL ?? 'http://localhost:4000';

export async function GET() {
  try {
    const res = await fetch(`${PORTAL_URL}/api/prestamos`, { cache: 'no-store' });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
