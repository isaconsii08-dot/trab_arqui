import { NextRequest, NextResponse } from 'next/server';

const PATRON_URL = process.env.PATRON_SERVICE_URL ?? 'http://localhost:3001';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const res = await fetch(`${PATRON_URL}/api/v1/patrons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
