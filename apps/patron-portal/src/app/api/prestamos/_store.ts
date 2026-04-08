export interface SolicitudPrestamo {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  cardNumber: string;
  itemBarcode?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada' | 'devuelta';
  creadaEn: string;
  notas?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __solicitudesPrestamo: SolicitudPrestamo[] | undefined;
}

export function getSolicitudes(): SolicitudPrestamo[] {
  if (!global.__solicitudesPrestamo) global.__solicitudesPrestamo = [];
  return global.__solicitudesPrestamo;
}
