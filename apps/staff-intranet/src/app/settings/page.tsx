import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Configuración</h1>
        <p className="font-mono text-xs text-text-muted">Ajustes del sistema</p>
      </div>

      <div className="surface-card p-8 flex flex-col items-center text-center">
        <Settings className="mb-4 h-12 w-12 text-text-muted/20" />
        <p className="font-display text-sm font-semibold text-text-primary">Configuración del sistema</p>
        <p className="mt-1 font-mono text-xs text-text-muted">
          Opciones de configuración avanzada próximamente disponibles.
        </p>
      </div>
    </div>
  );
}
