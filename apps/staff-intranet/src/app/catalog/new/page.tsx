'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Plus, Loader2, X, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const TIPOS = [
  { value: 'book',        label: 'Libro'           },
  { value: 'journal',     label: 'Revista'         },
  { value: 'audiovisual', label: 'Audiovisual'     },
  { value: 'digital',     label: 'Recurso digital' },
  { value: 'map',         label: 'Mapa'            },
  { value: 'archive',     label: 'Archivo'         },
];

export default function NewCatalogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authors, setAuthors] = useState<string[]>(['']);
  const [subjects, setSubjects] = useState<string[]>(['']);
  const [form, setForm] = useState({
    title: '', isbn: '', publicationYear: '', publisher: '', summary: '',
    materialType: 'book', coverImageUrl: '', libraryId: 'lib-001',
  });

  const [descargandoPortada, setDescargandoPortada] = useState(false);
  const [errorPortada, setErrorPortada] = useState('');

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
      if (!res.ok || !data.dataUrl) { setErrorPortada(data.error ?? 'No se pudo descargar'); return; }
      set('coverImageUrl', data.dataUrl);
      setErrorPortada(`Imagen descargada y guardada (${data.sizeKb} KB)`);
    } catch { setErrorPortada('Error de conexión'); } finally { setDescargandoPortada(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...form,
      publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
      isbn: form.isbn || null,
      publisher: form.publisher || null,
      summary: form.summary || null,
      coverImageUrl: form.coverImageUrl || null,
      authors: authors.filter(Boolean).map((name) => ({ name, role: 'author' })),
      subjects: subjects.filter(Boolean),
    };

    try {
      const res = await fetch('/api/catalogo/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { message?: string; id?: string };
      if (!res.ok) { setError(data.message ?? 'Error al crear el registro'); return; }
      router.refresh();
      router.push('/catalog');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/catalog" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Nuevo material</h1>
          <p className="font-mono text-xs text-text-muted">Añadir un nuevo registro bibliográfico al catálogo</p>
        </div>
      </div>

      <div className="surface-card p-6">
        {error && (
          <div className="mb-4 rounded-sm border border-accent-red/20 bg-accent-red/8 px-4 py-3 font-mono text-xs text-accent-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos principales */}
          <fieldset className="space-y-4">
            <legend className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">Datos principales</legend>

            <div>
              <label className="mb-1.5 block font-mono text-xs text-text-muted">Título *</label>
              <input type="text" required placeholder="Título completo del material" value={form.title} onChange={(e) => set('title', e.target.value)} className="input-dark" />
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
                <input type="text" placeholder="9780307474728" value={form.isbn} onChange={(e) => set('isbn', e.target.value)} className="input-dark" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block font-mono text-xs text-text-muted">Editorial</label>
                <input type="text" placeholder="Ej: Penguin Books" value={form.publisher} onChange={(e) => set('publisher', e.target.value)} className="input-dark" />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-xs text-text-muted">Año de publicación</label>
                <input type="number" placeholder="2024" min="1000" max="2099" value={form.publicationYear} onChange={(e) => set('publicationYear', e.target.value)} className="input-dark" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-text-muted">URL de portada</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://covers.openlibrary.org/b/id/…-L.jpg"
                  value={form.coverImageUrl}
                  onChange={(e) => { set('coverImageUrl', e.target.value); setErrorPortada(''); }}
                  className="input-dark flex-1 min-w-0"
                />
                {form.coverImageUrl && !form.coverImageUrl.startsWith('data:') && (
                  <button type="button" onClick={descargarPortada} disabled={descargandoPortada}
                    className="flex shrink-0 items-center gap-1.5 rounded-sm border border-accent-green/30 px-3 font-mono text-xs text-accent-green hover:bg-accent-green/5 disabled:opacity-50">
                    {descargandoPortada ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {descargandoPortada ? '...' : 'Guardar'}
                  </button>
                )}
              </div>
              {errorPortada && (
                <p className={`font-mono text-xs ${errorPortada.startsWith('Imagen') ? 'text-accent-green' : 'text-accent-red'}`}>{errorPortada}</p>
              )}
              {form.coverImageUrl && (
                <div className="flex items-start gap-3 mt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImageUrl} alt="Preview" className="h-20 w-14 rounded-sm object-cover bg-surface-raised" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                  <div className="space-y-1 text-[10px] font-mono text-text-muted">
                    <p>{form.coverImageUrl.startsWith('data:') ? `Embebida (${Math.round(form.coverImageUrl.length*0.75/1024)} KB)` : 'URL externa'}</p>
                    {!form.coverImageUrl.startsWith('data:') && (
                      <a href={form.coverImageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-green hover:underline">
                        <ExternalLink className="h-3 w-3" /> Ver imagen
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs text-text-muted">Sinopsis</label>
              <textarea rows={3} placeholder="Breve descripción del contenido..." value={form.summary} onChange={(e) => set('summary', e.target.value)} className="input-dark resize-none" />
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
            <button type="submit" disabled={loading} className="btn-green">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              {loading ? 'Guardando...' : 'Crear registro'}
            </button>
            <Link href="/catalog" className="btn-ghost">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
