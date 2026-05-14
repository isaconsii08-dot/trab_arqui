/**
 * Funciones para comunicarse con los microservicios de BiblioFlow.
 * Usadas desde componentes del servidor (Server Components) y rutas API.
 */

const CATALOG_URL  = process.env.CATALOG_SERVICE_URL  ?? 'http://127.0.0.1:3002';
const PATRON_URL   = process.env.PATRON_SERVICE_URL   ?? 'http://127.0.0.1:3001';
const CIRC_URL     = process.env.CIRC_SERVICE_URL     ?? 'http://127.0.0.1:3004';
const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://127.0.0.1:3003';

export interface LibroResumen {
  id: string;
  title: string;
  isbn: string | null;
  publicationYear: number | null;
  publisher: string | null;
  summary: string | null;
  coverImageUrl: string | null;
  materialType: string;
  authors: Array<{ id: string; name: string; role: string }>;
  subjects: Array<{ id: string; term: string }>;
  totalItems: number;
  availableItems: number;
}

export interface ResultadoBusqueda {
  data: LibroResumen[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface PrestamoActivo {
  id: string;
  itemId: string;
  patronId: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  renewedCount: number;
  fineAmount: number;
  itemBarcode: string;
  itemTitle: string;
}

// ─── Catálogo ─────────────────────────────────────────────────────────────────

export async function buscarCatalogo(params: Record<string, string | number | undefined>): Promise<ResultadoBusqueda> {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

  const res = await fetch(`${CATALOG_URL}/api/v1/catalog/search?${query}`, {
    cache: 'no-store',
  });

  if (!res.ok) return { data: [], total: 0, page: 1, limit: 20 };
  const result = await res.json() as ResultadoBusqueda;

  // Enriquecer con disponibilidad real desde el servicio de ejemplares
  if (result.data.length > 0) {
    const ids = result.data.map((r) => r.id).join(',');
    const avail = await fetch(
      `${HOLDINGS_URL}/api/v1/holdings/availability?recordIds=${ids}`,
      { cache: 'no-store' },
    )
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

export async function obtenerLibro(id: string): Promise<LibroResumen | null> {
  const res = await fetch(`${CATALOG_URL}/api/v1/catalog/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json() as Promise<LibroResumen>;
}

// ─── Ejemplares ───────────────────────────────────────────────────────────────

export async function obtenerEjemplaresLibro(recordId: string) {
  const res = await fetch(`${HOLDINGS_URL}/api/v1/holdings/records/${recordId}/items`, {
    cache: 'no-store',
  });
  if (!res.ok) return { items: [], total: 0, disponibles: 0 };
  return res.json() as Promise<{ items: unknown[]; total: number; disponibles: number }>;
}

// ─── Autenticación ────────────────────────────────────────────────────────────

export async function autenticar(email: string, password: string) {
  const res = await fetch(`${PATRON_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const data = await res.json() as {
    accessToken: string;
    expiresIn: string;
    user: { id: string; email: string; fullName: string; role: string; cardNumber?: string };
  };
  return {
    accessToken: data.accessToken,
    sub: data.user.id,
    role: data.user.role,
    fullName: data.user.fullName,
    cardNumber: data.user.cardNumber,
  };
}

// ─── Préstamos del socio ─────────────────────────────────────────────────────

export async function obtenerPrestamosActivos(patronId: string, token: string): Promise<PrestamoActivo[]> {
  const res = await fetch(`${CIRC_URL}/api/v1/circulation/loans/active?patronId=${patronId}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = await res.json() as { data: PrestamoActivo[] };
  return data.data ?? [];
}

// ─── Estadísticas públicas ────────────────────────────────────────────────────

let _svcToken: { value: string; expira: number } | null = null;

async function obtenerTokenServicio(): Promise<string | null> {
  if (_svcToken && Date.now() < _svcToken.expira) return _svcToken.value;
  try {
    const res = await fetch(`${PATRON_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'herrera@biblioflow.edu.co', password: 'Librarian2026!' }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json() as { accessToken: string };
    _svcToken = { value: data.accessToken, expira: Date.now() + 23 * 60 * 60 * 1000 };
    return data.accessToken;
  } catch { return null; }
}

export async function obtenerStatsPortal(): Promise<{ ejemplaresDisponibles: number; sociosActivos: number }> {
  const token = await obtenerTokenServicio();
  const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const [holdingsRes, patronRes] = await Promise.allSettled([
    fetch(`${HOLDINGS_URL}/api/v1/holdings/items?status=available`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() as Promise<unknown[]> : [] as unknown[]),
    fetch(`${PATRON_URL}/api/v1/patrons/stats`, {
      headers: authHeader,
      cache: 'no-store',
    }).then((r) => r.ok ? r.json() as Promise<{ activos?: number }> : { activos: 0 }),
  ]);

  const ejemplares = holdingsRes.status === 'fulfilled' && Array.isArray(holdingsRes.value)
    ? holdingsRes.value.length
    : 0;

  const patronData = patronRes.status === 'fulfilled' ? patronRes.value as { activos?: number } : null;
  const socios = patronData?.activos ?? 0;

  return { ejemplaresDisponibles: ejemplares, sociosActivos: socios };
}

export async function obtenerHistorialPrestamos(patronId: string, token: string, page = 1) {
  const res = await fetch(
    `${CIRC_URL}/api/v1/circulation/loans/patron/${patronId}?page=${page}&limit=20`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 0 } },
  );
  if (!res.ok) return { data: [], total: 0, page: 1, limit: 20 };
  return res.json() as Promise<{ data: PrestamoActivo[]; total: number; page: number; limit: number }>;
}
