'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

interface CatalogRecord {
  id: string;
  title: string;
  isbn: string | null;
  publicationYear: number | null;
  publisher: string | null;
  materialType: string;
  coverImageUrl: string | null;
  authors: Array<{ id: string; name: string; role: string }>;
  subjects: Array<{ id: string; term: string }>;
  totalItems: number;
  availableItems: number;
}

export function CatalogTableRows({ libros }: { libros: CatalogRecord[] }) {
  const router = useRouter();

  return (
    <>
      {libros.map((libro) => (
        <tr
          key={libro.id}
          className="table-row cursor-pointer hover:bg-surface-raised/60"
          onClick={() => router.push(`/catalog/${libro.id}`)}
          title={`Ver detalle de ${libro.title}`}
        >
          <td>
            <div className="relative h-12 w-9 overflow-hidden rounded-sm bg-surface-raised">
              {libro.coverImageUrl ? (
                <Image
                  src={libro.coverImageUrl}
                  alt={libro.title}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                <BookOpen className="absolute inset-0 m-auto h-4 w-4 text-text-muted/40" />
              )}
            </div>
          </td>
          <td className="max-w-[200px]">
            <p className="truncate font-medium text-text-primary">{libro.title}</p>
            {libro.subjects?.[0] && (
              <p className="truncate font-mono text-xs text-text-muted">{libro.subjects[0].term}</p>
            )}
          </td>
          <td className="max-w-[150px] truncate text-text-secondary">
            {libro.authors.map((a) => a.name).join(', ') || '—'}
          </td>
          <td className="font-mono text-xs text-text-muted">{libro.isbn ?? '—'}</td>
          <td className="font-mono text-xs text-text-muted">{libro.publicationYear ?? '—'}</td>
          <td className="font-mono text-sm text-text-secondary">{libro.totalItems}</td>
          <td>
            <span className={`font-mono text-sm font-medium ${
              libro.availableItems > 0 ? 'text-accent-green' : 'text-accent-red'
            }`}>
              {libro.availableItems}
            </span>
          </td>
          <td>
            <span className="font-mono text-xs text-accent-green">Ver →</span>
          </td>
        </tr>
      ))}
    </>
  );
}
