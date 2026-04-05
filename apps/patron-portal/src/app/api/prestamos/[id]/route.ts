import { NextRequest, NextResponse } from 'next/server';
import { getSolicitudes } from '../route';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json() as { estado?: string; notas?: string };
  const lista = getSolicitudes();
  const idx = lista.findIndex((s) => s.id === id);
  if (idx === -1) return NextResponse.json({ message: 'Solicitud no encontrada' }, { status: 404 });
  lista[idx] = { ...lista[idx], ...body } as typeof lista[0];
  return NextResponse.json(lista[idx]);
}
