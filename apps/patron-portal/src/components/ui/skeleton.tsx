export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-3 rounded-sm ${className}`} />;
}

export function SkeletonLoanCard() {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="skeleton h-14 w-10 shrink-0 rounded-sm" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="w-3/4" />
        <SkeletonLine className="w-1/2" />
        <SkeletonLine className="w-1/3" />
      </div>
      <div className="shrink-0 space-y-2">
        <SkeletonLine className="w-16 ml-auto" />
        <SkeletonLine className="w-20 ml-auto" />
      </div>
    </div>
  );
}

export function PaperSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-5 w-5 border-2' : size === 'lg' ? 'h-12 w-12 border-[3px]' : 'h-8 w-8 border-2';
  return (
    <span
      className={`inline-block animate-spin rounded-full ${sz}`}
      style={{ borderColor: '#C1614A', borderTopColor: 'transparent' }}
      aria-label="Cargando..."
    />
  );
}

export function LoadingModal({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(245,239,224,0.92)', backdropFilter: 'blur(4px)' }}>
      {/* Grain sutil */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.05,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '256px 256px',
        }}
      />
      <div className="relative flex flex-col items-center gap-5">
        {/* Anillo exterior decorativo */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute h-20 w-20 rounded-full opacity-15"
            style={{ border: '1px solid #C1614A' }}
          />
          <PaperSpinner size="lg" />
        </div>
        <p className="font-display text-base italic" style={{ color: '#8B3A27' }}>{label}</p>
      </div>
    </div>
  );
}
