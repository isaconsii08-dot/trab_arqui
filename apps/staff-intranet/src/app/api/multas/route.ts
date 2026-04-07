import { NextResponse } from 'next/server';
import { obtenerCredencialesServicio } from '@/lib/api';

const PATRON_URL   = process.env.PATRON_SERVICE_URL   ?? 'http://localhost:3001';
const CIRC_URL     = process.env.CIRC_SERVICE_URL     ?? 'http://localhost:3004';
const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://localhost:3003';
const CATALOG_URL  = process.env.CATALOG_SERVICE_URL  ?? 'http://localhost:3002';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { token } = await obtenerCredencialesServicio();

    // 1. Traer todos los socios
    const patronesRes = await fetch(`${PATRON_URL}/api/v1/patrons?page=1&limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!patronesRes.ok) return NextResponse.json([]);
    const patronesData = await patronesRes.json() as { data: Array<{ id: string; fullName: string; cardNumber: string; email: string }> };
    const patrones = patronesData.data ?? [];

    // 2. Para cada socio, traer sus multas (pending)
    const results: Array<{
      fineId: string;
      patronId: string;
      patronName: string;
      patronCard: string;
      patronEmail: string;
      loanId: string;
      amount: number;
      reason: string;
      status: string;
      createdAt: string;
      paidAt: string | null;
      itemBarcode?: string;
      itemTitle?: string;
    }> = [];

    await Promise.all(
      patrones.map(async (p) => {
        try {
          const fRes = await fetch(`${PATRON_URL}/api/v1/patrons/${p.id}/fines?all=1`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (!fRes.ok) return;
          const fd = await fRes.json() as { fines: Array<{ id: string; loanId: string; amount: number; reason: string; status: string; createdAt: string; paidAt: string | null }> };
          for (const f of fd.fines ?? []) {
            results.push({
              fineId: f.id,
              patronId: p.id,
              patronName: p.fullName,
              patronCard: p.cardNumber,
              patronEmail: p.email,
              loanId: f.loanId,
              amount: Number(f.amount),
              reason: f.reason,
              status: f.status,
              createdAt: f.createdAt,
              paidAt: f.paidAt,
            });
          }
        } catch { /* ignorar */ }
      }),
    );

    // 3. Enriquecer con barcode + título del préstamo
    const loanIds = [...new Set(results.map((r) => r.loanId))];
    const loanMap: Record<string, { itemBarcode: string; itemTitle: string }> = {};

    await Promise.all(
      loanIds.map(async (loanId) => {
        try {
          const lRes = await fetch(`${CIRC_URL}/api/v1/circulation/loans/${loanId}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (!lRes.ok) return;
          const loan = await lRes.json() as { itemBarcode?: string; itemId?: string };
          const barcode = loan.itemBarcode ?? loan.itemId ?? '';
          if (!barcode) return;

          // barcode → recordId → título
          const hRes = await fetch(`${HOLDINGS_URL}/api/v1/holdings/items/${barcode}`, { cache: 'no-store' });
          const hData = hRes.ok ? await hRes.json() as { recordId?: string } : null;
          const recordId = hData?.recordId;
          let title = barcode;
          if (recordId) {
            const cRes = await fetch(`${CATALOG_URL}/api/v1/catalog/${recordId}`, { cache: 'no-store' });
            if (cRes.ok) {
              const cat = await cRes.json() as { title?: string };
              title = cat.title ?? barcode;
            }
          }
          loanMap[loanId] = { itemBarcode: barcode, itemTitle: title };
        } catch { /* ignorar */ }
      }),
    );

    for (const r of results) {
      const info = loanMap[r.loanId];
      if (info) {
        r.itemBarcode = info.itemBarcode;
        r.itemTitle = info.itemTitle;
      }
    }

    return NextResponse.json(results.sort((a, b) => {
      // Pendientes primero, luego por fecha desc
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
