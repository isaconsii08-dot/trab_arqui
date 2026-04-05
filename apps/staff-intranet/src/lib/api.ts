/**
 * Funciones para comunicarse con los microservicios desde la intranet del personal.
 * Solo se usan en Server Components o rutas API de Next.js.
 */

const PATRON_URL = process.env.PATRON_SERVICE_URL  ?? 'http://localhost:3001';
const CATALOG_URL = process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3002';
const CIRC_URL    = process.env.CIRC_SERVICE_URL    ?? 'http://localhost:3004';

// Credenciales del servicio (bibliotecario de turno)
let tokenCache: { value: string; staffId: string; libraryId: string; expira: number } | null = null;

async function obtenerCredencialesServicio(): Promise<{ token: string; staffId: string; libraryId: string }> {
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

  // Extraer libraryId del payload JWT (campo 4 del token decodificado)
  let libraryId = 'lib-001';
  try {
    const payload = JSON.parse(atob(data.accessToken.split('.')[1] ?? '')) as { libraryId?: string };
    libraryId = payload.libraryId ?? 'lib-001';
  } catch { /* usar valor por defecto */ }

  tokenCache = {
    value: data.accessToken,
    staffId: data.user.id,
    libraryId,
    expira: Date.now() + 23 * 60 * 60 * 1000,
  };
  return { token: data.accessToken, staffId: data.user.id, libraryId };
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
      next: { revalidate: 60 },
    }).then((r) => r.ok ? r.json() : { total: 0, activos: 0, suspendidos: 0 }),
    fetch(`${CIRC_URL}/api/v1/circulation/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    }).then((r) => r.ok ? r.json() : { prestamosVencidos: 0 }),
    fetch(`${CATALOG_URL}/api/v1/catalog/search?limit=1`, {
      next: { revalidate: 300 },
    }).then((r) => r.ok ? r.json() : { total: 0 }),
  ]);

  return {
    socios: patroStats as { total: number; activos: number; suspendidos: number; expirados: number },
    circulacion: circStats as { prestamosVencidos: number },
    catalogTotal: (catalogTotal as { total: number }).total,
  };
}

// ─── Socios ───────────────────────────────────────────────────────────────────

export async function listarSocios(page = 1, limit = 20) {
  const token = await obtenerTokenServicio();
  const res = await fetch(
    `${PATRON_URL}/api/v1/patrons?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 30 } },
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

export async function listarCatalogo(params: Record<string, string | number | undefined> = {}) {
  const query = Object.entries({ limit: 20, page: 1, ...params })
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

  const res = await fetch(`${CATALOG_URL}/api/v1/catalog/search?${query}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return { data: [], total: 0 };
  return res.json() as Promise<{ data: unknown[]; total: number }>;
}

// ─── Préstamos recientes ──────────────────────────────────────────────────────

export async function obtenerPrestamosVencidos() {
  const token = await obtenerTokenServicio();
  const res = await fetch(`${CIRC_URL}/api/v1/circulation/loans/active`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const data = await res.json() as { data: unknown[] };
  return data.data ?? [];
}
