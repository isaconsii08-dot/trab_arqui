import { NextRequest, NextResponse } from 'next/server';

declare global {
  // eslint-disable-next-line no-var
  var __salasReservas: import('../route').Reserva[] | undefined;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sessionId = req.nextUrl.searchParams.get('sessionId') ?? '';

  const store = global.__salasReservas ?? [];
  const idx = store.findIndex((r) => r.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }

  // Solo puede cancelar el propietario
  if (store[idx]!.sessionId !== sessionId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  store.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}
