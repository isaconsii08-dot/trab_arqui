'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Server } from 'lucide-react';

interface ServiceStatus {
  name: string;
  key: string;
  port: number;
  status: 'ok' | 'error' | 'down';
  latency: number;
  httpStatus: number | null;
  info: Record<string, unknown>;
}

const STATUS_CONFIG = {
  ok:    { icon: CheckCircle,   color: 'text-accent-green', bg: 'bg-accent-green/10 border-accent-green/20', label: 'Activo'  },
  error: { icon: AlertTriangle, color: 'text-accent-amber', bg: 'bg-accent-amber/10 border-accent-amber/20', label: 'Error'   },
  down:  { icon: XCircle,       color: 'text-accent-red',   bg: 'bg-accent-red/10 border-accent-red/20',     label: 'Caído'   },
};

const SERVICE_NAMES: Record<string, string> = {
  patron:      'Servicio de Socios',
  catalog:     'Servicio de Catálogo',
  holdings:    'Servicio de Inventario',
  circulation: 'Servicio de Circulación',
};

const SERVICE_DESC: Record<string, string> = {
  patron:      'Gestión de socios, multas y autenticación',
  catalog:     'Registros bibliográficos y metadatos',
  holdings:    'Inventario de ejemplares físicos',
  circulation: 'Préstamos, devoluciones y reservas',
};

export function ServiceStatusWidget() {
  const [services, setServices]   = useState<ServiceStatus[]>([]);
  const [loading, setLoading]     = useState(true);
  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) setServices(await res.json());
    } catch { /* ignorar */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    check();
    const iv = setInterval(check, 30000);
    window.addEventListener('biblioflow:refresh', check);
    return () => { clearInterval(iv); window.removeEventListener('biblioflow:refresh', check); };
  }, [check]);

  const downCount = services.filter(s => s.status === 'down').length;

  return (
    <div className="space-y-3">
      {/* Cards */}
      {loading && services.length === 0 ? (
        <div className="flex items-center justify-center py-10 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted/30" />
          <p className="font-mono text-xs text-text-muted">Verificando servicios...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((svc) => {
            const cfg = STATUS_CONFIG[svc.status];
            const StatusIcon = cfg.icon;
            const isDown = svc.status === 'down';

            return (
              <div key={svc.key} className="surface-card overflow-hidden">
                {/* Header */}
                <div className={`flex items-center justify-between border-b px-4 py-3 ${cfg.bg}`}>
                  <div className="flex items-center gap-2">
                    <Server className={`h-4 w-4 ${cfg.color}`} />
                    <span className="font-body text-sm font-medium text-text-primary">
                      {SERVICE_NAMES[svc.key] ?? svc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
                    <span className={`font-mono text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 py-3 space-y-2">
                  <p className="font-mono text-xs text-text-muted">{SERVICE_DESC[svc.key]}</p>
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Puerto</p>
                      <p className="font-mono text-xs text-text-secondary">{svc.port}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Latencia</p>
                      <p className={`font-mono text-xs font-medium ${
                        isDown ? 'text-text-muted' :
                        svc.latency < 200 ? 'text-accent-green' :
                        svc.latency < 500 ? 'text-accent-amber' : 'text-accent-red'
                      }`}>
                        {isDown ? '—' : `${svc.latency}ms`}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">HTTP</p>
                      <p className="font-mono text-xs text-text-secondary">{svc.httpStatus ?? '—'}</p>
                    </div>
                    {typeof svc.info?.total === 'number' && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Registros</p>
                        <p className="font-mono text-xs text-text-secondary">{(svc.info.total as number).toLocaleString()}</p>
                      </div>
                    )}
                    {typeof svc.info?.prestamosActivos === 'number' && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Préstamos activos</p>
                        <p className="font-mono text-xs text-accent-amber font-medium">{svc.info.prestamosActivos as number}</p>
                      </div>
                    )}
                    {typeof svc.info?.prestamosVencidos === 'number' && (svc.info.prestamosVencidos as number) > 0 && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Vencidos</p>
                        <p className="font-mono text-xs text-accent-red font-medium">{svc.info.prestamosVencidos as number}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {downCount > 0 && (
        <div className="rounded-sm border border-accent-red/20 bg-accent-red/8 px-4 py-3 flex items-start gap-3">
          <XCircle className="h-4 w-4 text-accent-red mt-0.5 shrink-0" />
          <div>
            <p className="font-body text-sm font-medium text-accent-red">
              {downCount} servicio{downCount > 1 ? 's' : ''} caído{downCount > 1 ? 's' : ''}
            </p>
            <p className="font-mono text-xs text-text-muted mt-0.5">
              Algunas funciones del sistema pueden no estar disponibles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
