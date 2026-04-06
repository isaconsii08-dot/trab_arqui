import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CIRC_URL     = process.env.CIRC_SERVICE_URL     ?? 'http://localhost:3004';
const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://localhost:3003';
const CATALOG_URL  = process.env.CATALOG_SERVICE_URL  ?? 'http://localhost:3002';

interface RawLoan {
  id: string;
  itemId: string;
  itemBarcode?: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  renewedCount: number;
  fineAmount: number;
}

async function enrichLoans(loans: RawLoan[]) {
  const barcodes = [...new Set(loans.map((l) => l.itemId).filter(Boolean))];
  if (barcodes.length === 0) return loans;

  const recordIdMap: Record<string, string> = {};
  await Promise.all(
    barcodes.map(async (barcode) => {
      try {
        const res = await fetch(`${HOLDINGS_URL}/api/v1/holdings/items/${encodeURIComponent(barcode)}`);
        if (res.ok) {
          const item = await res.json() as { barcode: string; recordId?: string };
          if (item?.recordId) recordIdMap[barcode] = item.recordId;
        }
      } catch { /* ignore */ }
    }),
  );

  const uniqueRecordIds = [...new Set(Object.values(recordIdMap))];
  const catalogMap: Record<string, { title?: string; coverImageUrl?: string }> = {};
  await Promise.all(
    uniqueRecordIds.map(async (recordId) => {
      try {
        const res = await fetch(`${CATALOG_URL}/api/v1/catalog/${recordId}`);
        if (res.ok) {
          const data = await res.json() as { title?: string; coverImageUrl?: string };
          catalogMap[recordId] = { title: data.title, coverImageUrl: data.coverImageUrl };
        }
      } catch { /* ignore */ }
    }),
  );

  return loans.map((loan) => {
    const barcode = loan.itemId;
    const recordId = recordIdMap[barcode];
    const catalogData = recordId ? catalogMap[recordId] : undefined;
    return {
      ...loan,
      itemBarcode: barcode,
      itemTitle: catalogData?.title ?? '',
      coverImageUrl: catalogData?.coverImageUrl ?? null,
    };
  });
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('bf_token')?.value;
  const userRaw = cookieStore.get('bf_user')?.value;

  if (!token || !userRaw) {
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 });
  }

  let patronId: string;
  try {
    const user = JSON.parse(decodeURIComponent(userRaw)) as { sub?: string; id?: string };
    patronId = user.sub ?? user.id ?? '';
  } catch {
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 });
  }

  if (!patronId) return NextResponse.json({ data: [], total: 0, page: 1, limit: 20 });

  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '20';

  try {
    const res = await fetch(
      `${CIRC_URL}/api/v1/circulation/loans/patron/${patronId}?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ data: [], total: 0, page: Number(page), limit: Number(limit) });
    const raw = await res.json() as { data: RawLoan[]; total: number };
    const enriched = await enrichLoans(raw.data ?? []);
    return NextResponse.json({ ...raw, data: enriched });
  } catch {
    return NextResponse.json({ data: [], total: 0, page: Number(page), limit: Number(limit) });
  }
}
