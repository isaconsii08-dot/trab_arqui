import { NextRequest, NextResponse } from 'next/server';

const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://127.0.0.1:3003';

export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get('barcode');
  if (!barcode) return NextResponse.json({ available: false });
  try {
    const res = await fetch(
      `${HOLDINGS_URL}/api/v1/holdings/items/barcode/${encodeURIComponent(barcode)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ available: false });
    const item = await res.json() as { status?: string };
    return NextResponse.json({ available: item.status === 'available' });
  } catch {
    return NextResponse.json({ available: false });
  }
}
