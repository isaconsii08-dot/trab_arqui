import { NextRequest, NextResponse } from 'next/server';
import { obtenerTokenServicio } from '@/lib/api';

const PATRON_URL   = 'http://127.0.0.1:3001';
const HOLDINGS_URL = 'http://127.0.0.1:3003';
const CATALOG_URL  = 'http://127.0.0.1:3002';

// GET /api/circulacion/lookup?type=patron&q=texto
// GET /api/circulacion/lookup?type=item&q=texto
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    // ── Búsqueda de SOCIOS ────────────────────────────────────────────────
    if (type === 'patron') {
      const token = await obtenerTokenServicio();
      const res = await fetch(
        `${PATRON_URL}/api/v1/patrons?query=${encodeURIComponent(q)}&limit=8`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return NextResponse.json([]);
      const data = await res.json() as { data?: unknown[] };
      return NextResponse.json(data.data ?? []);
    }

    // ── Búsqueda de EJEMPLARES ────────────────────────────────────────────
    if (type === 'item') {
      const esBarcode = /^EJ\d/i.test(q);

      if (esBarcode) {
        // Barcode exacto → buscar en holdings directamente
        const res = await fetch(`${HOLDINGS_URL}/api/v1/holdings/items/${encodeURIComponent(q)}`);
        if (!res.ok) return NextResponse.json([]);
        const item = await res.json() as { barcode: string; recordId?: string; status: string; location: string } | null;
        if (!item) return NextResponse.json([]);

        // Enriquecer con título del catálogo
        let title: string | undefined;
        if (item.recordId) {
          const cat = await fetch(`${CATALOG_URL}/api/v1/catalog/${item.recordId}`).catch(() => null);
          if (cat?.ok) {
            const catData = await cat.json() as { title?: string };
            title = catData.title;
          }
        }
        return NextResponse.json([{ ...item, title: title ?? item.barcode }]);
      }

      // Texto libre → buscar en CATÁLOGO por título
      const catRes = await fetch(
        `${CATALOG_URL}/api/v1/catalog/search?query=${encodeURIComponent(q)}&limit=8`,
      );
      if (!catRes.ok) return NextResponse.json([]);
      const catData = await catRes.json() as { data?: Array<{ id: string; title: string }> };
      const libros = catData.data ?? [];
      if (libros.length === 0) return NextResponse.json([]);

      // Para cada libro traer sus ejemplares disponibles del holdings
      const recordIds = libros.map((l) => l.id).join(',');
      const availRes = await fetch(
        `${HOLDINGS_URL}/api/v1/holdings/availability?recordIds=${recordIds}`,
      );
      const avail = availRes.ok
        ? (await availRes.json() as Record<string, { total: number; available: number }>)
        : {};

      // Traer los ejemplares disponibles (status=available primero) de cada libro
      const results: Array<{ barcode: string; title: string; status: string; location: string; recordId: string }> = [];

      await Promise.all(
        libros.map(async (libro) => {
          const itemsRes = await fetch(
            `${HOLDINGS_URL}/api/v1/holdings/records/${libro.id}/items`,
          );
          if (!itemsRes.ok) return;
          const itemsData = await itemsRes.json() as {
            items?: Array<{ barcode: string; status: string; location: string; recordId: string }>;
          };
          const items = itemsData.items ?? [];

          // Ordenar: disponibles primero, máximo 3 por libro
          const sorted = [...items].sort((a, b) =>
            a.status === 'available' ? -1 : b.status === 'available' ? 1 : 0,
          );
          for (const it of sorted.slice(0, 3)) {
            results.push({ ...it, title: libro.title });
          }
        }),
      );

      // Si no hay ejemplares en holdings, devolver al menos los libros con disponibilidad
      if (results.length === 0) {
        return NextResponse.json(
          libros.map((l) => ({
            barcode: '',
            title: l.title,
            status: (avail[l.id]?.available ?? 0) > 0 ? 'available' : 'unavailable',
            location: '',
            recordId: l.id,
          })),
        );
      }

      return NextResponse.json(results);
    }

    return NextResponse.json([]);
  } catch (err) {
    console.error('Lookup error:', err);
    return NextResponse.json([]);
  }
}
