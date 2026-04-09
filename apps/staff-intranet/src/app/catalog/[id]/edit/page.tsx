'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Loader2, X, Plus, Trash2, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ConfirmModal } from '@/components/ui/confirm-modal';

const TIPOS = [
  { value: 'book',        label: 'Libro'           },
  { value: 'journal',     label: 'Revista'         },
  { value: 'audiovisual', label: 'Audiovisual'     },
  { value: 'digital',     label: 'Recurso digital' },
  { value: 'map',         label: 'Mapa'            },
  { value: 'archive',     label: 'Archivo'         },
];

interface CatalogRecord {
  id: string;
  title: string;
  isbn: string | null;
  issn: string | null;
  publicationYear: number | null;
  publisher: string | null;
  summary: string | null;
  materialType: string;
  coverImageUrl: string | null;
  uniformTitle: string | null;
  edition: string | null;
  isActive: boolean;
  authors: Array<{ id: string; name: string; role: string }>;
  subjects: Array<{ id: string; term: string }>;
}

export default function EditCatalogPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [reactivando, setReactivando] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [error, setError] = useState('');

  const [descargandoPortada, setDescargandoPortada] = useState(false);
  const [errorPortada, setErrorPortada] = useState('');

  const [authors, setAuthors] = useState<string[]>(['']);
  const [subjects, setSubjects] = useState<string[]>(['']);
  const [form, setForm] = useState({
    title: '', isbn: '', issn: '', publicationYear: '', publisher: '',
    summary: '', materialType: 'book', coverImageUrl: '', uniformTitle: '', edition: '',
  });

  useEffect(() => {
    fetch(`/api/catalogo/${id}`)
      .then((r) => r.json())
      .then((data: CatalogRecord) => {
        setForm({
          title: data.title ?? '',
          isbn: data.isbn ?? '',
          issn: data.issn ?? '',
          publicationYear: data.publicationYear?.toString() ?? '',
          publisher: data.publisher ?? '',
          summary: data.summary ?? '',
          materialType: data.materialType ?? 'book',
          coverImageUrl: data.coverImageUrl ?? '',
          uniformTitle: data.uniformTitle ?? '',
          edition: data.edition ?? '',
        });
        setIsActive(data.isActive ?? true);
        setAuthors(data.authors?.map((a) => a.name) ?? ['']);
        setSubjects(data.subjects?.map((s) => s.term) ?? ['']);
      })
      .catch(() => setError('No se pudo cargar el registro'))
      .finally(() => setCargando(false));
  }, [id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const descargarPortada = async () => {
    if (!form.coverImageUrl) return;
    setDescargandoPortada(true);
    setErrorPortada('');
    try {
      const res = await fetch('/api/catalogo/fetch-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.coverImageUrl }),
      });
      const data = await res.json() as { dataUrl?: string; sizeKb?: number; error?: string };
      if (!res.ok || !data.dataUrl) {
        setErrorPortada(data.error ?? 'No se pudo descargar la imagen');
        return;
      }
      set('coverImageUrl', data.dataUrl);
      setErrorPortada(`Imagen descargada y guardada (${data.sizeKb} KB)`);
    } catch {
      setErrorPortada('Error de conexión al descargar');
    } finally {
      setDescargandoPortada(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');

    const payload = {
      title: form.title,
      isbn: form.isbn || null,
      issn: form.issn || null,
      publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
      publisher: form.publisher || null,
      summary: form.summary || null,
      materialType: form.materialType,
      coverImageUrl: form.coverImageUrl || null,
      uniformTitle: form.uniformTitle || null,
      edition: form.edition || null,
      authors: authors.filter(Boolean).map((name) => ({ name, role: 'author' })),
      subjects: subjects.filter(Boolean),
    };

    try {
      const res = await fetch(`/api/catalogo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) { setError(data.message ?? 'Error al actualizar'); return; }
      router.refresh();
      router.push(`/catalog/${id}`);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async () => {
    setEliminando(true);
    try {
      const res = await fetch(`/api/catalogo/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        router.refresh();
        router.push('/catalog');
      } else {
        const data = await res.json() as { message?: string };
        setError(data.message ?? 'Error al desactivar');
        setConfirmarEliminar(false);
      }
    } catch {
      setError('No se pudo conectar con el servidor');
      setConfirmarEliminar(false);
    } finally {
      setEliminando(false);
    }
  };

  const handleReactivar = async () => {
    setReactivando(true);
    try {
      const res = await fetch(`/api/catalogo/${id}`, { method: 'PATCH' });
      if (res.ok || res.status === 204) {
        setIsActive(true);
      } else {
        const data = await res.json() as { message?: string };
        setError(data.message ?? 'Error al reactivar');
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setReactivando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/catalog/${id}`} className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Editar registro</h1>
          <p className="font-mono text-xs text-text-muted">{id}</p>
        </div>
      </div>

      {(guardando || eliminando || reactivando) && (
        <LoadingOverlay label={guardando ? 'Guardando cambios...' : eliminando ? 'Desactivando...' : 'Reactivando...'} />
      )}

      {!isActive && (
        <div className="rounded-sm border border-accent-amber/30 bg-accent-amber/8 px-4 py-3 font-mono text-xs text-accent-amber">
          Este registro está <strong>desactivado</strong> y no aparece en el catálogo público.
        </div>
      )}

      <div className="surface-card p-6">
        {error && (
          <div className="mb-4 rounded-sm border border-accent-red/20 bg-accent-red/8 px-4 py-3 font-mono text-xs text-accent-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset className="space-y-4">
            <legend className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">Datos principales</legend>

            <div>
              <label className="mb-1.5 block font-mono text-xs text-text-muted">Título *</label>
              <input type="text" required value={form.title} onChange={(e) => set('title', e.target.value)} className="input-dark" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block font-mono text-xs text-text-muted">Tipo de material *</label>
                <select value={form.materialType} onChange={(e) => set('materialType', e.target.value)} className="input-dark">
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-xs text-text-muted">ISBN</label>
                <input type="text" value={form.isbn} onChange={(e) => set('isbn', e.target.value)} className="input-dark" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block font-mono text-xs text-text-muted">Editorial</label>
                <input type="text" value={form.publisher} onChange={(e) => set('publisher', e.target.value)} className="input-dark" />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-xs text-text-muted">Año de publicación</label>
                <input type="number" min="1000" max="2099" value={form.publicationYear} onChange={(e) => set('publicationYear', e.target.value)} className="input-dark" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block font-mono text-xs text-text-muted">Título uniforme</label>
                <input type="text" value={form.uniformTitle} onChange={(e) => set('uniformTitle', e.target.value)} className="input-dark" />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-xs text-text-muted">Edición</label>
                <input type="text" value={form.edition} onChange={(e) => set('edition', e.target.value)} className="input-dark" />
              </div>
            </div>

            {/* Portada */}
            <div className="space-y-2">
              <label className="block font-mono text-xs text-text-muted">URL de portada</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.coverImageUrl}
                  onChange={(e) => { set('coverImageUrl', e.target.value); setErrorPortada(''); }}
                  placeholder="https://covers.openlibrary.org/b/id/…-L.jpg o data:image/…"
                  className="input-dark flex-1 min-w-0"
                />
                {form.coverImageUrl && !form.coverImageUrl.startsWith('data:') && (
                  <button
                    type="button"
                    onClick={descargarPortada}
                    disabled={descargandoPortada}
                    title="Descargar imagen y guardar en base de datos"
                    className="flex shrink-0 items-center gap-1.5 rounded-sm border border-accent-green/30 px-3 font-mono text-xs text-accent-green hover:bg-accent-green/5 disabled:opacity-50"
                  >
                    {descargandoPortada
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Download className="h-3.5 w-3.5" />}
                    {descargandoPortada ? '...' : 'Guardar'}
                  </button>
                )}
              </div>
              {errorPortada && (
                <p className={`font-mono text-xs ${errorPortada.startsWith('Imagen') ? 'text-accent-green' : 'text-accent-red'}`}>
                  {errorPortada}
                </p>
              )}
              {/* Preview */}
              {form.coverImageUrl && (
                <div className="mt-2 flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.coverImageUrl}
                    alt="Preview portada"
                    className="h-20 w-14 rounded-sm object-cover bg-surface-raised"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] text-text-muted">
                      {form.coverImageUrl.startsWith('data:')
                        ? `Imagen embebida (${Math.round(form.coverImageUrl.length * 0.75 / 1024)} KB aprox.)`
                        : 'URL externa'}
                    </p>
                    {!form.coverImageUrl.startsWith('data:') && (
                      <a
                        href={form.coverImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-accent-green hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Ver imagen
                      </a>
                    )}
                    <p className="font-mono text-[10px] text-text-muted/60">
                      Tip: usa &quot;Guardar&quot; para embeber la imagen en la BD y evitar dependencia de URLs externas.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs text-text-muted">Sinopsis</label>
              <textarea rows={3} value={form.summary} onChange={(e) => set('summary', e.target.value)} className="input-dark resize-none" />
            </div>
          </fieldset>

          {/* Autores */}
          <fieldset className="space-y-3">
            <legend className="mb-1 font-mono text-xs uppercase tracking-wider text-text-muted">Autores</legend>
            {authors.map((a, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Autor ${i + 1}`}
                  value={a}
                  onChange={(e) => { const n = [...authors]; n[i] = e.target.value; setAuthors(n); }}
                  className="input-dark flex-1"
                />
                {authors.length > 1 && (
                  <button type="button" onClick={() => setAuthors(authors.filter((_, j) => j !== i))} className="text-text-muted hover:text-accent-red transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setAuthors([...authors, ''])} className="flex items-center gap-1 font-mono text-xs text-accent-green hover:underline">
              <Plus className="h-3 w-3" /> Añadir autor
            </button>
          </fieldset>

          {/* Materias */}
          <fieldset className="space-y-3">
            <legend className="mb-1 font-mono text-xs uppercase tracking-wider text-text-muted">Materias / Palabras clave</legend>
            {subjects.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Materia ${i + 1}`}
                  value={s}
                  onChange={(e) => { const n = [...subjects]; n[i] = e.target.value; setSubjects(n); }}
                  className="input-dark flex-1"
                />
                {subjects.length > 1 && (
                  <button type="button" onClick={() => setSubjects(subjects.filter((_, j) => j !== i))} className="text-text-muted hover:text-accent-red transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setSubjects([...subjects, ''])} className="flex items-center gap-1 font-mono text-xs text-accent-green hover:underline">
              <Plus className="h-3 w-3" /> Añadir materia
            </button>
          </fieldset>

          <div className="flex gap-3 border-t border-surface-border pt-4">
            <button type="submit" disabled={guardando} className="btn-green">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <Link href={`/catalog/${id}`} className="btn-ghost">Cancelar</Link>
            {isActive ? (
              <button
                type="button"
                onClick={() => setConfirmarEliminar(true)}
                className="ml-auto flex items-center gap-1.5 font-mono text-xs text-accent-red hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Desactivar registro
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReactivar}
                disabled={reactivando}
                className="ml-auto flex items-center gap-1.5 font-mono text-xs text-accent-green hover:underline disabled:opacity-50"
              >
                {reactivando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
                {reactivando ? 'Reactivando...' : 'Reactivar registro'}
              </button>
            )}
          </div>
        </form>
      </div>

      {confirmarEliminar && (
        <ConfirmModal
          title="¿Desactivar este registro?"
          description="El libro dejará de aparecer en el catálogo pero se conservará el historial de préstamos e imágenes."
          confirmLabel="Sí, desactivar"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setConfirmarEliminar(false)}
        />
      )}
    </div>
  );
}
