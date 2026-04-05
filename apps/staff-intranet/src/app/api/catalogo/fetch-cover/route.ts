import { NextRequest, NextResponse } from 'next/server';

// Límite: 5 MB para evitar portadas excesivamente grandes
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { url } = await req.json() as { url?: string };

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BiblioFlow/1.0 (cover downloader)' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `La URL respondió con error ${res.status}` },
        { status: 400 },
      );
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'La URL no apunta a una imagen' },
        { status: 400 },
      );
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: 'La imagen supera el límite de 5 MB' },
        { status: 400 },
      );
    }

    // Verificar que no sea el GIF 1×1 de Open Library (no-cover placeholder)
    if (buffer.byteLength < 100) {
      return NextResponse.json(
        { error: 'La imagen parece ser un placeholder vacío (imagen demasiado pequeña)' },
        { status: 400 },
      );
    }

    const base64 = Buffer.from(buffer).toString('base64');
    // Normalizar el content type (ej: image/jpeg;charset=utf-8 → image/jpeg)
    const mimeType = contentType.split(';')[0]!.trim();
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      dataUrl,
      mimeType,
      sizeKb: Math.round(buffer.byteLength / 1024),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al descargar la imagen';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
