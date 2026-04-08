import { NextResponse } from 'next/server';
import { obtenerTokenServicio } from '@/lib/api';

export const dynamic = 'force-dynamic';

const PATRON_URL   = process.env.PATRON_SERVICE_URL   ?? 'http://localhost:3001';
const CATALOG_URL  = process.env.CATALOG_SERVICE_URL  ?? 'http://localhost:3002';
const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://localhost:3003';
const CIRC_URL     = process.env.CIRC_SERVICE_URL     ?? 'http://localhost:3004';

export async function GET() {
  let token = '';
  try { token = await obtenerTokenServicio(); } catch { /* sin token */ }

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const opts = { cache: 'no-store' as const, signal: AbortSignal.timeout(3000) };

  const services = [
    { name: 'Patron Service',      key: 'patron',      port: 3001, url: `${PATRON_URL}/api/v1/patrons?page=1&limit=1`,        auth: true  },
    { name: 'Catalog Service',     key: 'catalog',     port: 3002, url: `${CATALOG_URL}/api/v1/catalog/search?limit=1`,     auth: false },
    { name: 'Holdings Service',    key: 'holdings',    port: 3003, url: `${HOLDINGS_URL}/api/v1/holdings/items?limit=1`,     auth: false },
    { name: 'Circulation Service', key: 'circulation', port: 3004, url: `${CIRC_URL}/api/v1/circulation/stats`,              auth: true  },
  ];

  const results = await Promise.all(
    services.map(async (svc) => {
      const start = Date.now();
      try {
        const headers = svc.auth ? authHeader : {};
        const res = await fetch(svc.url, { ...opts, headers });
        const latency = Date.now() - start;
        // Cualquier respuesta HTTP (incluso 401/403) = servicio activo
        const up = res.status < 500;
        let info: Record<string, unknown> = {};
        if (res.ok) {
          try { info = await res.json() as Record<string, unknown>; } catch { /* ignorar */ }
        }
        return { name: svc.name, key: svc.key, port: svc.port, status: up ? 'ok' : 'error', latency, httpStatus: res.status, info };
      } catch {
        return { name: svc.name, key: svc.key, port: svc.port, status: 'down', latency: Date.now() - start, httpStatus: null, info: {} };
      }
    }),
  );

  return NextResponse.json(results);
}
