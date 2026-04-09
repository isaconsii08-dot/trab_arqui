'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmCls =
    variant === 'danger'
      ? 'bg-accent-red/10 text-accent-red border border-accent-red/30 hover:bg-accent-red/20'
      : variant === 'warning'
        ? 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30 hover:bg-accent-amber/20'
        : 'btn-green';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,13,18,0.80)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-sm border border-surface-border bg-surface-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-red/10">
            <AlertTriangle className="h-4 w-4 text-accent-red" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-text-primary">{title}</h3>
            <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost text-sm">{cancelLabel}</button>
          <button onClick={onConfirm} className={`rounded-sm px-4 py-2 font-mono text-xs transition-colors ${confirmCls}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
