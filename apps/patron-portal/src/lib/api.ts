/**
 * Funciones para comunicarse con los microservicios de BiblioFlow.
 * Usadas desde componentes del servidor (Server Components) y rutas API.
 */

const CATALOG_URL = process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3002';
const PATRON_URL  = process.env.PATRON_SERVICE_URL  ?? 'http://localhost:3001';
const CIRC_URL    = process.env.CIRC_SERVICE_URL    ?? 'http://localhost:3004';

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
  return res.json() as Promise<ResultadoBusqueda>;
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
  const res = await fetch(`http://localhost:3003/api/v1/holdings/records/${recordId}/items`, {
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

export async function obtenerHistorialPrestamos(patronId: string, token: string, page = 1) {
  const res = await fetch(
    `${CIRC_URL}/api/v1/circulation/loans/patron/${patronId}?page=${page}&limit=20`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 0 } },
  );
  if (!res.ok) return { data: [], total: 0, page: 1, limit: 20 };
  return res.json() as Promise<{ data: PrestamoActivo[]; total: number; page: number; limit: number }>;
}
