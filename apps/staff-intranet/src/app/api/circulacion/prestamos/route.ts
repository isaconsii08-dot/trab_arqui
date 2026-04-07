import { NextResponse } from 'next/server';
import { obtenerCredencialesServicio } from '@/lib/api';

const PATRON_URL   = process.env.PATRON_SERVICE_URL   ?? 'http://127.0.0.1:3001';
const CATALOG_URL  = process.env.CATALOG_SERVICE_URL  ?? 'http://127.0.0.1:3002';
const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://127.0.0.1:3003';
const CIRC_URL     = process.env.CIRC_SERVICE_URL     ?? 'http://127.0.0.1:3004';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { token } = await obtenerCredencialesServicio();

    const [loansRes, patronesRes] = await Promise.all([
      fetch(`${CIRC_URL}/api/v1/circulation/loans/active`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${PATRON_URL}/api/v1/patrons?page=1&limit=300`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ]);

    if (!loansRes.ok) return NextResponse.json([]);
    const loansData = await loansRes.json() as { data: Array<Record<string, unknown>> };
    const loans = loansData.data ?? [];
    if (loans.length === 0) return NextResponse.json([]);

    // Patron map
    const patronMap: Record<string, { fullName: string; cardNumber: string; status: string }> = {};
    if (patronesRes.ok) {
      const pd = await patronesRes.json() as { data: Array<{ id: string; fullName: string; cardNumber: string; status: string }> };
      for (const p of pd.data ?? []) patronMap[p.id] = { fullName: p.fullName, cardNumber: p.cardNumber, status: p.status };
    }

    // Holdings: barcode → recordId
    const barcodes = loans.map((l) => l.itemBarcode as string).filter(Boolean);
    const holdingsMap: Record<string, { recordId: string; location: string }> = {};
    await Promise.all(barcodes.map((bc) =>
      fetch(`${HOLDINGS_URL}/api/v1/holdings/items/${bc}`, { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .then((item: { barcode: string; recordId: string; location?: string } | null) => {
          if (item) holdingsMap[item.barcode] = { recordId: item.recordId, location: item.location ?? '' };
        })
        .catch(() => {}),
    ));

    // Catalog: recordId → { title, coverImageUrl, authors }
    const uniqueRecordIds = [...new Set(Object.values(holdingsMap).map((h) => h.recordId))];
    const catalogMap: Record<string, { title: string; coverImageUrl: string | null; authors: string }> = {};
    await Promise.all(uniqueRecordIds.map((id) =>
      fetch(`${CATALOG_URL}/api/v1/catalog/${id}`, { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .then((d: { title?: string; coverImageUrl?: string | null; authors?: Array<{ name: string }> } | null) => {
          if (d) catalogMap[id] = {
            title: d.title ?? '',
            coverImageUrl: d.coverImageUrl ?? null,
            authors: d.authors?.map((a) => a.name).join(', ') ?? '',
          };
        })
        .catch(() => {}),
    ));

    const enriched = loans.map((l) => {
      const recordId = holdingsMap[l.itemBarcode as string]?.recordId;
      const catalog = recordId ? catalogMap[recordId] : null;
      const patron = patronMap[l.patronId as string];
      return {
        ...l,
        recordId,
        itemTitle: catalog?.title || (l.itemTitle as string) || (l.itemBarcode as string),
        coverImageUrl: catalog?.coverImageUrl ?? null,
        itemAuthors: catalog?.authors ?? '',
        itemLocation: holdingsMap[l.itemBarcode as string]?.location ?? '',
        patronName: patron?.fullName ?? (l.patronId as string),
        patronCardNumber: patron?.cardNumber ?? '',
        patronStatus: patron?.status ?? '',
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
