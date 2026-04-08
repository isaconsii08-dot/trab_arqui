'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, CheckCircle, XCircle, AlertTriangle, Loader2, Server, Clock, Wifi } from 'lucide-react';

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

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        setServices(await res.json());
        setLastCheck(new Date());
      }
    } catch { /* ignorar */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [check]);

  const okCount   = services.filter((s) => s.status === 'ok').length;
  const downCount = services.filter((s) => s.status === 'down').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Estado del sistema</h1>
          <p className="font-mono text-xs text-text-muted">Monitoreo en tiempo real de los microservicios</p>
        </div>
        <button onClick={check} disabled={loading} className="btn-ghost flex items-center gap-1.5 text-sm">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wifi className="h-4 w-4 text-text-muted" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Servicios activos</span>
          </div>
          <p className="font-display text-2xl font-semibold text-text-primary">
            {loading && services.length === 0
              ? <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              : <>{okCount}<span className="text-text-muted text-base">/{services.length}</span></>
            }
          </p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-text-muted" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Latencia promedio</span>
          </div>
          <p className="font-display text-2xl font-semibold text-text-primary">
            {services.filter(s => s.status === 'ok').length === 0
              ? '—'
              : `${Math.round(services.filter(s => s.status === 'ok').reduce((a, s) => a + s.latency, 0) / services.filter(s => s.status === 'ok').length)}ms`
            }
          </p>
        </div>
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-text-muted" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Última verificación</span>
          </div>
          <p className="font-mono text-sm text-text-secondary">
            {lastCheck ? lastCheck.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '—'}
          </p>
          <p className="font-mono text-[10px] text-text-muted">Auto-refresh 30s</p>
        </div>
      </div>

      {/* Tarjetas */}
      {loading && services.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-text-muted/30" />
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
                      <p className={`font-mono text-xs font-medium ${isDown ? 'text-text-muted' : svc.latency < 200 ? 'text-accent-green' : svc.latency < 500 ? 'text-accent-amber' : 'text-accent-red'}`}>
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
                        <p className="font-mono text-xs text-text-secondary">{svc.info.total as number}</p>
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
            <p className="font-body text-sm font-medium text-accent-red">{downCount} servicio{downCount > 1 ? 's' : ''} caído{downCount > 1 ? 's' : ''}</p>
            <p className="font-mono text-xs text-text-muted mt-0.5">Algunas funciones del sistema pueden no estar disponibles.</p>
          </div>
        </div>
      )}
    </div>
  );
}
