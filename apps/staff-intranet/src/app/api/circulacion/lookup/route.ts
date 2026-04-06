import { NextRequest, NextResponse } from 'next/server';
import { obtenerTokenServicio } from '@/lib/api';

const PATRON_URL   = process.env.PATRON_SERVICE_URL   ?? 'http://localhost:3001';
const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://localhost:3003';

// GET /api/circulacion/lookup?type=patron&q=LIB-...
// GET /api/circulacion/lookup?type=item&q=EJ001-01
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const q = searchParams.get('q')?.trim();

  if (!type || !q) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  try {
    const token = await obtenerTokenServicio();

    if (type === 'patron') {
      const res = await fetch(`${PATRON_URL}/api/v1/patrons/card/${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) return NextResponse.json(null);
      return NextResponse.json(await res.json());
    }

    if (type === 'item') {
      const res = await fetch(`${HOLDINGS_URL}/api/v1/holdings/items/${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return NextResponse.json(null);
      const item = await res.json() as { recordId?: string; status?: string; location?: string } | null;
      if (!item) return NextResponse.json(null);

      // Enriquecer con título del catálogo si hay recordId
      if (item.recordId) {
        const catRes = await fetch(
          `${process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3002'}/api/v1/catalog/${item.recordId}`,
          { cache: 'no-store' },
        );
        if (catRes.ok) {
          const cat = await catRes.json() as { title?: string };
          return NextResponse.json({ ...item, title: cat.title });
        }
      }
      return NextResponse.json(item);
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
