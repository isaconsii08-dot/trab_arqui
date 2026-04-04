import { MapPin, Clock, Users, Wifi } from 'lucide-react';
import Navbar from '@/components/layout/navbar';

const espacios = [
  {
    id: 's1',
    nombre: 'Sala de estudio A',
    capacidad: 8,
    planta: 'Planta 1',
    disponible: true,
    wifi: true,
    horario: '07:00 – 22:00',
    descripcion: 'Sala silenciosa con 8 puestos. Ideal para trabajo individual o grupos pequeños.',
  },
  {
    id: 's2',
    nombre: 'Sala de estudio B',
    capacidad: 6,
    planta: 'Planta 1',
    disponible: false,
    wifi: true,
    horario: '07:00 – 22:00',
    descripcion: 'Sala con pantalla de proyección. Reservada hasta las 17:00.',
  },
  {
    id: 's3',
    nombre: 'Sala de grupos C',
    capacidad: 12,
    planta: 'Planta 2',
    disponible: true,
    wifi: true,
    horario: '08:00 – 20:00',
    descripcion: 'Sala amplia para grupos de trabajo. Incluye pizarrón y proyector.',
  },
  {
    id: 's4',
    nombre: 'Cabina de lectura 1',
    capacidad: 2,
    planta: 'Planta 2',
    disponible: true,
    wifi: false,
    horario: '07:00 – 22:00',
    descripcion: 'Cabina privada para lectura o estudio individual. Sin ruido.',
  },
  {
    id: 's5',
    nombre: 'Cabina de lectura 2',
    capacidad: 2,
    planta: 'Planta 2',
    disponible: false,
    wifi: false,
    horario: '07:00 – 22:00',
    descripcion: 'Cabina privada para lectura o estudio individual. Sin ruido.',
  },
  {
    id: 's6',
    nombre: 'Sala multimedia',
    capacidad: 10,
    planta: 'Planta 3',
    disponible: true,
    wifi: true,
    horario: '08:00 – 18:00',
    descripcion: 'Equipada con computadores y acceso a bases de datos especializadas.',
  },
];

export default function SpacesPage() {
  const disponibles = espacios.filter((e) => e.disponible).length;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-parchment">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-8">
            <span className="section-label">Biblioteca UCC</span>
            <h1 className="heading-md mt-2 text-ink">Salas y espacios</h1>
            <p className="mt-1 font-body text-sm text-ink-muted">
              {disponibles} de {espacios.length} espacios disponibles ahora
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {espacios.map((espacio) => (
              <div
                key={espacio.id}
                className={`card p-5 ${!espacio.disponible ? 'opacity-60' : ''}`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h2 className="font-display text-base font-semibold text-ink">{espacio.nombre}</h2>
                  <span
                    className={`rounded-sm px-2 py-0.5 font-mono text-xs font-medium ${
                      espacio.disponible
                        ? 'bg-emerald-library/10 text-emerald-library'
                        : 'bg-rust/10 text-rust'
                    }`}
                  >
                    {espacio.disponible ? 'Disponible' : 'Ocupada'}
                  </span>
                </div>

                <p className="mb-4 font-body text-sm text-ink-muted">{espacio.descripcion}</p>

                <div className="space-y-1.5 text-xs text-ink-muted">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{espacio.planta}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>Hasta {espacio.capacidad} personas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{espacio.horario}</span>
                  </div>
                  {espacio.wifi && (
                    <div className="flex items-center gap-2">
                      <Wifi className="h-3.5 w-3.5 shrink-0" />
                      <span>WiFi disponible</span>
                    </div>
                  )}
                </div>

                {espacio.disponible && (
                  <button
                    className="btn-amber mt-4 w-full justify-center text-sm"
                    onClick={() => alert('Funcionalidad de reserva próximamente disponible')}
                  >
                    Reservar
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-sm border border-ink/8 bg-parchment-light p-4 font-body text-sm text-ink-muted">
            <strong className="text-ink">Horario de atención:</strong> Lunes a viernes 7:00 – 22:00 · Sábados 8:00 – 16:00
          </div>
        </div>
      </div>
    </>
  );
}
