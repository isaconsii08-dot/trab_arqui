'use client';

export function LoadingOverlay({ label = 'Procesando...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(10,13,18,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 rounded-full opacity-10" style={{ border: '1px solid #4ade80' }} />
          <span
            className="inline-block h-10 w-10 animate-spin rounded-full"
            style={{ border: '2px solid #4ade80', borderTopColor: 'transparent' }}
          />
        </div>
        <p className="font-mono text-sm" style={{ color: '#4ade80' }}>{label}</p>
      </div>
    </div>
  );
}
