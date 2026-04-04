import { MapPin, Clock, Users, Wifi } from 'lucide-react';

const espacios = [
  { id: 's1', nombre: 'Sala de estudio A', capacidad: 8,  planta: 'Planta 1', disponible: true,  wifi: true,  horario: '07:00 – 22:00' },
  { id: 's2', nombre: 'Sala de estudio B', capacidad: 6,  planta: 'Planta 1', disponible: false, wifi: true,  horario: '07:00 – 22:00' },
  { id: 's3', nombre: 'Sala de grupos C',  capacidad: 12, planta: 'Planta 2', disponible: true,  wifi: true,  horario: '08:00 – 20:00' },
  { id: 's4', nombre: 'Cabina 1',          capacidad: 2,  planta: 'Planta 2', disponible: true,  wifi: false, horario: '07:00 – 22:00' },
  { id: 's5', nombre: 'Cabina 2',          capacidad: 2,  planta: 'Planta 2', disponible: false, wifi: false, horario: '07:00 – 22:00' },
  { id: 's6', nombre: 'Sala multimedia',   capacidad: 10, planta: 'Planta 3', disponible: true,  wifi: true,  horario: '08:00 – 18:00' },
];

export default function SpacesPage() {
  const disponibles = espacios.filter((e) => e.disponible).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-text-primary">Salas y espacios</h1>
        <p className="font-mono text-xs text-text-muted">
          {disponibles} de {espacios.length} espacios disponibles
        </p>
      </div>

      <div className="surface-card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Sala</th>
              <th>Planta</th>
              <th>Capacidad</th>
              <th>Horario</th>
              <th>WiFi</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {espacios.map((esp) => (
              <tr key={esp.id} className="table-row">
                <td className="font-medium">{esp.nombre}</td>
                <td className="text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-text-muted" />
                    {esp.planta}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1.5 font-mono text-sm text-text-secondary">
                    <Users className="h-3 w-3 text-text-muted" />
                    {esp.capacidad}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                    <Clock className="h-3 w-3" />
                    {esp.horario}
                  </div>
                </td>
                <td>
                  {esp.wifi ? (
                    <Wifi className="h-4 w-4 text-accent-green" />
                  ) : (
                    <span className="font-mono text-xs text-text-muted">—</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${esp.disponible ? 'badge-green' : 'badge-red'}`}>
                    {esp.disponible ? 'Disponible' : 'Ocupada'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
