import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSolicitudes, type SolicitudPrestamo } from './_store';

export async function GET() {
  return NextResponse.json(getSolicitudes());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<SolicitudPrestamo>;

    if (!body.bookId || !body.cardNumber) {
      return NextResponse.json({ message: 'Faltan datos (bookId o carnet)' }, { status: 400 });
    }

    const solicitud: SolicitudPrestamo = {
      id: randomUUID(),
      bookId: body.bookId,
      bookTitle: body.bookTitle ?? 'Libro desconocido',
      userId: body.userId ?? 'anonymous',
      userName: body.userName ?? 'Socio',
      cardNumber: body.cardNumber,
      itemBarcode: body.itemBarcode,
      estado: 'pendiente',
      creadaEn: new Date().toISOString(),
    };

    getSolicitudes().unshift(solicitud);

    return NextResponse.json({
      ok: true,
      message: 'Solicitud enviada. Debes esperar a que un bibliotecario la apruebe.',
      solicitud,
    }, { status: 201 });

  } catch {
    return NextResponse.json({ message: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
