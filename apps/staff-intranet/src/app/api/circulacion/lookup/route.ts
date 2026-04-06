import { NextRequest, NextResponse } from 'next/server';
import { obtenerTokenServicio } from '@/lib/api';

const PATRON_URL   = 'http://127.0.0.1:3001';
const HOLDINGS_URL = 'http://127.0.0.1:3003';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const q = searchParams.get('q');

  if (!q || q.length < 3) return NextResponse.json([]);

  const token = await obtenerTokenServicio();

  try {
    if (type === 'patron') {
      // Buscar socios por nombre o carnet (patron-service ya devuelve {data: []})
      const res = await fetch(`${PATRON_URL}/api/v1/patrons?query=${encodeURIComponent(q)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return NextResponse.json(data);
    } 
    
    if (type === 'item') {
      // Buscar ejemplares por barcode o título (holdings-service ya devuelve {data: []})
      const res = await fetch(`${HOLDINGS_URL}/api/v1/holdings/items?query=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json([]);
  } catch (err) {
    console.error('Error en lookup API:', err);
    return NextResponse.json([]);
  }
}
