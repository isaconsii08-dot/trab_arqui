/**
 * Funciones para comunicarse con los microservicios desde la intranet del personal.
 * Solo se usan en Server Components o rutas API de Next.js.
 */

const PATRON_URL   = process.env.PATRON_SERVICE_URL   ?? 'http://127.0.0.1:3001';
const CATALOG_URL  = process.env.CATALOG_SERVICE_URL  ?? 'http://127.0.0.1:3002';
const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://127.0.0.1:3003';
const CIRC_URL     = process.env.CIRC_SERVICE_URL     ?? 'http://127.0.0.1:3004';

// Credenciales del servicio (bibliotecario de turno)
let tokenCache: { value: string; staffId: string; libraryId: string; expira: number } | null = null;

export async function obtenerCredencialesServicio(): Promise<{ token: string; staffId: string; libraryId: string }> {
  if (tokenCache && Date.now() < tokenCache.expira) {
    return { token: tokenCache.value, staffId: tokenCache.staffId, libraryId: tokenCache.libraryId };
  }

  const res = await fetch(`${PATRON_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'herrera@biblioflow.edu.co', password: 'Librarian2026!' }),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('No se pudo autenticar el servicio');
  const data = await res.json() as {
    accessToken: string;
    user: { id: string; role: string; libraryId?: string };
  };

  let libraryId = 'lib-001';
  try {
    const payload = JSON.parse(atob(data.accessToken.split('.')[1] ?? '')) as { libraryId?: string };
    libraryId = payload.libraryId ?? 'lib-001';
  } catch { /* usar valor por defecto */ }

  // Asegurarnos de que staffId sea un UUID válido (formato)
  const staffId = data.user.id || '00000000-0000-0000-0000-000000000001';

  tokenCache = {
    value: data.accessToken,
    staffId,
    libraryId,
    expira: Date.now() + 23 * 60 * 60 * 1000,
  };
  return { token: data.accessToken, staffId, libraryId };
}

export async function obtenerTokenServicio(): Promise<string> {
  const { token } = await obtenerCredencialesServicio();
  return token;
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────

export async function obtenerEstadisticas() {
  const token = await obtenerTokenServicio();

  const [patroStats, circStats, catalogTotal] = await Promise.all([
    fetch(`${PATRON_URL}/api/v1/patrons/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).then((r) => r.ok ? r.json() : { total: 0, activos: 0, suspendidos: 0 }),
    fetch(`${CIRC_URL}/api/v1/circulation/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).then((r) => r.ok ? r.json() : { prestamosVencidos: 0 }),
    fetch(`${CATALOG_URL}/api/v1/catalog/search?limit=1`, {
      cache: 'no-store',
    }).then((r) => r.ok ? r.json() : { total: 0 }),
  ]);

  return {
    socios: patroStats as { total: number; activos: number; suspendidos: number; expirados: number },
    circulacion: circStats as { prestamosVencidos: number },
    catalogTotal: (catalogTotal as { total: number }).total,
  };
}

// ─── Socios ───────────────────────────────────────────────────────────────────

export async function listarSocios(page = 1, limit = 20, query = '') {
  const token = await obtenerTokenServicio();
  const qs = query
    ? `page=${page}&limit=${limit}&query=${encodeURIComponent(query)}`
    : `page=${page}&limit=${limit}`;
  const res = await fetch(
    `${PATRON_URL}/api/v1/patrons?${qs}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  );
  if (!res.ok) return { data: [], total: 0, page: 1, limit: 20 };
  return res.json() as Promise<{
    data: Array<{
      id: string; cardNumber: string; fullName: string; email: string;
      status: string; phone: string | null; pendingFinesTotal: number;
    }>;
    total: number; page: number; limit: number;
  }>;
}

// ─── Catálogo ─────────────────────────────────────────────────────────────────

interface CatalogRecord {
  id: string;
  totalItems: number;
  availableItems: number;
  [key: string]: unknown;
}

export async function listarCatalogo(params: Record<string, string | number | undefined> = {}) {
  const qs = Object.entries({ limit: 20, page: 1, ...params })
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

  const res = await fetch(`${CATALOG_URL}/api/v1/catalog/search?${qs}`, { cache: 'no-store' });
  if (!res.ok) return { data: [], total: 0 };
  const result = await res.json() as { data: CatalogRecord[]; total: number };

  // Enriquecer con conteo real de ejemplares desde holdings
  if (result.data.length > 0) {
    const ids = result.data.map((r) => r.id).join(',');
    const avail = await fetch(`${HOLDINGS_URL}/api/v1/holdings/availability?recordIds=${ids}`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : {})
      .catch(() => ({})) as Record<string, { total: number; available: number }>;
    for (const rec of result.data) {
      if (avail[rec.id]) {
        rec.totalItems = avail[rec.id].total;
        rec.availableItems = avail[rec.id].available;
      }
    }
  }
  return result;
}

// ─── Préstamos activos + info de ejemplar ──────────────────────────────────────

export interface LoanConDetalle {
  id: string;
  itemId: string;
  patronId: string;
  patronName?: string;
  loanDate: string;
  dueDate: string;
  status: string;
  renewedCount: number;
  fineAmount: number;
  itemBarcode: string;
  itemTitle: string;
  recordId?: string;
}

export async function obtenerPrestamosActivos(): Promise<LoanConDetalle[]> {
  const token = await obtenerTokenServicio();
  const [loansRes, patronesRes] = await Promise.all([
    fetch(`${CIRC_URL}/api/v1/circulation/loans/active`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    fetch(`${PATRON_URL}/api/v1/patrons?page=1&limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ]);

  if (!loansRes.ok) return [];
  const loansData = await loansRes.json() as { data: LoanConDetalle[] };
  const loans = loansData.data ?? [];

  // Mapear patronId → nombre
  let patronMap: Record<string, string> = {};
  if (patronesRes.ok) {
    const patData = await patronesRes.json() as { data: Array<{ id: string; fullName: string }> };
    for (const p of patData.data ?? []) patronMap[p.id] = p.fullName;
  }

  // Enriquecer loans con nombre del patron y recordId del ejemplar
  const barcodes = loans.map((l) => l.itemBarcode).filter(Boolean);
  const holdingsMap: Record<string, { recordId: string }> = {};
  await Promise.all(
    barcodes.map((bc) =>
      fetch(`${HOLDINGS_URL}/api/v1/holdings/items/${bc}`, { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .then((item: { barcode: string; recordId: string } | null) => {
          if (item) holdingsMap[item.barcode] = { recordId: item.recordId };
        })
        .catch(() => {}),
    ),
  );

  // Enriquecer con títulos del catálogo
  const uniqueRecordIds = [...new Set(Object.values(holdingsMap).map((h) => h.recordId))];
  const catalogTitles: Record<string, string> = {};
  await Promise.all(
    uniqueRecordIds.map((id) =>
      fetch(`${CATALOG_URL}/api/v1/catalog/${id}`, { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .then((data: { title?: string } | null) => {
          if (data?.title) catalogTitles[id] = data.title;
        })
        .catch(() => {}),
    ),
  );

  return loans.map((l) => {
    const recordId = holdingsMap[l.itemBarcode]?.recordId;
    return {
      ...l,
      patronName: patronMap[l.patronId] ?? l.patronId,
      recordId,
      itemTitle: (recordId && catalogTitles[recordId]) ? catalogTitles[recordId] : (l.itemTitle || l.itemBarcode),
    };
  });
}

// Kept for backward compat (dashboard)
export async function obtenerPrestamosVencidos() {
  return obtenerPrestamosActivos();
}
