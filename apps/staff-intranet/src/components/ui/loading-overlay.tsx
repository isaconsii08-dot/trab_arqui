'use client';

export function LoadingOverlay({ label = 'Procesando...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] !mt-0 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(245,239,224,0.92)' }}>
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 rounded-full opacity-15" style={{ border: '1px solid #C1614A' }} />
          <span
            className="inline-block h-12 w-12 animate-spin rounded-full border-[3px]"
            style={{ borderColor: '#C1614A', borderTopColor: 'transparent' }}
          />
        </div>
        <p className="font-display text-base italic" style={{ color: '#8B3A27' }}>{label}</p>
      </div>
    </div>
  );
}
