'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshButton({ className }: { className?: string }) {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 800);
  }

  return (
    <button
      onClick={handleRefresh}
      title="Actualizar datos"
      className={`flex items-center gap-1.5 rounded-sm border border-surface-border px-2.5 py-1.5 font-mono text-xs text-text-muted hover:bg-surface-raised hover:text-text-primary transition-colors ${className ?? ''}`}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${spinning ? 'animate-spin' : ''}`} />
      Actualizar
    </button>
  );
}
