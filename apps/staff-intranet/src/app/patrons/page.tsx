import { Search, UserPlus, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

const mockPatrons = [
  { id: '1', cardNumber: 'UCC-20250901-A1B2', fullName: 'Ana García López', email: 'ana.garcia@ucc.es', status: 'active', loans: 2, fines: 0 },
  { id: '2', cardNumber: 'UCC-20250902-C3D4', fullName: 'Carlos Ruiz Martínez', email: 'carlos.ruiz@ucc.es', status: 'suspended', loans: 0, fines: 5.5 },
  { id: '3', cardNumber: 'UCC-20250903-E5F6', fullName: 'María López Sánchez', email: 'maria.lopez@ucc.es', status: 'active', loans: 3, fines: 0 },
  { id: '4', cardNumber: 'UCC-20250904-G7H8', fullName: 'Jorge Martín Pérez', email: 'jorge.martin@ucc.es', status: 'active', loans: 1, fines: 1.0 },
  { id: '5', cardNumber: 'UCC-20250905-I9J0', fullName: 'Laura Sánchez Torres', email: 'laura.sanchez@ucc.es', status: 'expired', loans: 0, fines: 0 },
];

export default function PatronsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Gestión de socios</h1>
          <p className="font-mono text-xs text-text-muted">1,284 socios registrados</p>
        </div>
        <Link href="/patrons/new" className="btn-green">
          <UserPlus className="h-4 w-4" />
          Nuevo socio
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-sm border border-surface-border bg-surface-raised px-3 py-2.5">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            type="search"
            placeholder="Buscar por nombre, email o nº de carnet..."
            className="flex-1 bg-transparent font-body text-sm text-text-primary placeholder-text-muted focus:outline-none"
          />
        </div>
        <button className="btn-ghost">
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Socio</th>
              <th>Nº Carnet</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Préstamos</th>
              <th>Multas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mockPatrons.map((patron) => (
              <tr key={patron.id} className="table-row">
                <td className="font-medium">{patron.fullName}</td>
                <td className="font-mono text-xs text-text-muted">{patron.cardNumber}</td>
                <td className="text-text-secondary">{patron.email}</td>
                <td>
                  {patron.status === 'active'    && <span className="badge badge-green"><CheckCircle className="mr-1 h-3 w-3" />Activo</span>}
                  {patron.status === 'suspended' && <span className="badge badge-red"><XCircle className="mr-1 h-3 w-3" />Suspendido</span>}
                  {patron.status === 'expired'   && <span className="badge badge-amber"><Clock className="mr-1 h-3 w-3" />Caducado</span>}
                </td>
                <td className="font-mono text-sm text-text-secondary">{patron.loans}</td>
                <td className={`font-mono text-sm ${patron.fines > 0 ? 'text-accent-amber' : 'text-text-muted'}`}>
                  {patron.fines > 0 ? `€${patron.fines.toFixed(2)}` : '—'}
                </td>
                <td>
                  <Link href={`/patrons/${patron.id}`} className="font-mono text-xs text-accent-green hover:underline">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
