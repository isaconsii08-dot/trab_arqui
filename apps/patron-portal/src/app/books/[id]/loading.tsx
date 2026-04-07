import Navbar from '@/components/layout/navbar';

function Sk({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-sm ${className}`} style={{ minHeight: '12px' }} />;
}

export default function BookDetailLoading() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-5xl px-6 py-10">

          {/* Volver */}
          <Sk className="mb-8 h-3 w-32" />

          <div className="grid gap-10 md:grid-cols-[280px_1fr]">

            {/* ── Columna portada ── */}
            <div className="space-y-4">
              {/* Portada */}
              <div className="aspect-[3/4] w-full overflow-hidden rounded-sm">
                <Sk className="h-full w-full" />
              </div>
              {/* Badge disponibilidad */}
              <Sk className="h-20 w-full" />
            </div>

            {/* ── Columna detalle ── */}
            <div>
              {/* Tags materia */}
              <div className="mb-3 flex gap-2">
                <Sk className="h-6 w-20 rounded-full" />
                <Sk className="h-6 w-16 rounded-full" />
              </div>

              {/* Título */}
              <Sk className="h-9 w-3/4" />
              <Sk className="mt-3 h-5 w-1/2" />

              {/* Sinopsis */}
              <div className="mt-6 space-y-2">
                <Sk className="h-3 w-28" />
                <Sk className="h-3 w-full" />
                <Sk className="h-3 w-full" />
                <Sk className="h-3 w-5/6" />
                <Sk className="h-3 w-2/3" />
              </div>

              {/* Metadata grid */}
              <div className="mt-8 grid grid-cols-2 gap-5 rounded-sm border border-ink/8 bg-parchment-light p-5">
                {[0, 1, 2, 3].map((n) => (
                  <div key={n} className="flex items-start gap-3">
                    <Sk className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Sk className="h-2.5 w-3/4" />
                      <Sk className="h-3.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Ejemplares */}
              <div className="mt-8 space-y-3">
                <Sk className="h-3 w-44" />
                {[0, 1].map((n) => (
                  <div key={n} className="flex items-center justify-between rounded-sm border border-ink/8 bg-white px-4 py-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sk className="h-3 w-24" />
                        <Sk className="h-4 w-16 rounded-full" />
                      </div>
                      <Sk className="h-2.5 w-32" />
                    </div>
                    <Sk className="ml-4 h-8 w-24 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
