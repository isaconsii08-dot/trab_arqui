import { NextRequest, NextResponse } from 'next/server';

const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://localhost:3003';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const res = await fetch(`${HOLDINGS_URL}/api/v1/holdings/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { barcode: string; action: 'release' | 'reserve' };
    const endpoint = body.action === 'release' ? 'release' : 'reserve';
    const res = await fetch(`${HOLDINGS_URL}/api/v1/holdings/items/${body.barcode}/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
