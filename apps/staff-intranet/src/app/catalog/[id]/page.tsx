import { BookOpen, ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ItemsManager from './items-manager';

const CATALOG_URL = process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3002';
const HOLDINGS_URL = process.env.HOLDINGS_SERVICE_URL ?? 'http://localhost:3003';

interface CatalogRecord {
  id: string;
  title: string;
  isbn: string | null;
  publicationYear: number | null;
  publisher: string | null;
  summary: string | null;
  materialType: string;
  coverImageUrl: string | null;
  authors: Array<{ id: string; name: string; role: string }>;
  subjects: Array<{ id: string; term: string }>;
  totalItems: number;
  availableItems: number;
}

interface Item {
  id: string;
  barcode: string;
  location: string;
  callNumber: string | null;
  status: string;
  condition: string;
}

async function obtenerLibro(id: string): Promise<CatalogRecord | null> {
  const res = await fetch(`${CATALOG_URL}/api/v1/catalog/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json() as Promise<CatalogRecord>;
}

async function obtenerEjemplares(recordId: string): Promise<Item[]> {
  const res = await fetch(
    `${HOLDINGS_URL}/api/v1/holdings/records/${recordId}/items`,
    { cache: 'no-store' },
  );
  if (!res.ok) return [];
  const data = await res.json() as { items?: Item[] };
  return data.items ?? [];
}

const estadoItem: Record<string, { label: string; badge: string }> = {
  available:   { label: 'Disponible',   badge: 'badge-green' },
  loaned:      { label: 'Prestado',     badge: 'badge-amber' },
  reserved:    { label: 'Reservado',    badge: 'badge-blue'  },
  maintenance: { label: 'Mantenimiento',badge: 'badge-red'   },
  lost:        { label: 'Perdido',      badge: 'badge-red'   },
};

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [libro, ejemplares] = await Promise.all([
    obtenerLibro(id),
    obtenerEjemplares(id),
  ]);

  if (!libro) notFound();

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link href="/catalog" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary line-clamp-1">
            {libro.title}
          </h1>
          <p className="font-mono text-xs text-text-muted">{libro.id}</p>
        </div>
        <Link href={`/catalog/${id}/edit`} className="ml-auto btn-ghost text-sm">
          <Pencil className="h-4 w-4" /> Editar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Portada y datos principales */}
        <div className="space-y-4">
          <div className="surface-card overflow-hidden">
            <div className="relative aspect-[3/4] bg-surface-raised">
              {libro.coverImageUrl ? (
                <Image
                  src={libro.coverImageUrl}
                  alt={`Portada de ${libro.title}`}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-text-muted/20" />
                </div>
              )}
            </div>
          </div>

          <div className="surface-card p-4 space-y-3">
            {[
              { label: 'ISBN',      value: libro.isbn ?? '—' },
              { label: 'Año',       value: libro.publicationYear?.toString() ?? '—' },
              { label: 'Editorial', value: libro.publisher ?? '—' },
              { label: 'Tipo',      value: libro.materialType },
              {
                label: 'Autores',
                value: libro.authors.map((a) => a.name).join(', ') || '—',
              },
              {
                label: 'Materias',
                value: libro.subjects.map((s) => s.term).join(', ') || '—',
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-mono text-xs text-text-muted">{label}</p>
                <p className="font-body text-sm text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen y ejemplares */}
        <div className="lg:col-span-2 space-y-6">
          {libro.summary && (
            <div className="surface-card p-5">
              <h2 className="mb-2 font-display text-sm font-semibold text-text-primary">Resumen</h2>
              <p className="font-body text-sm leading-relaxed text-text-secondary">{libro.summary}</p>
            </div>
          )}

          <ItemsManager recordId={id} items={ejemplares} />
        </div>
      </div>
    </div>
  );
}
