import { ShoppingCart, Plus } from 'lucide-react';

export default function AcquisitionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Adquisiciones</h1>
          <p className="font-mono text-xs text-text-muted">Gestión de solicitudes y compras</p>
        </div>
        <button className="btn-green">
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </button>
      </div>

      <div className="surface-card p-8 flex flex-col items-center text-center">
        <ShoppingCart className="mb-4 h-12 w-12 text-text-muted/20" />
        <p className="font-display text-sm font-semibold text-text-primary">Módulo en desarrollo</p>
        <p className="mt-1 font-mono text-xs text-text-muted">
          La gestión de adquisiciones y órdenes de compra estará disponible próximamente.
        </p>
      </div>
    </div>
  );
}
