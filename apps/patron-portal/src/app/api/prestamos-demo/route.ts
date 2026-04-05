import { NextResponse } from 'next/server';

const CIRC_URL   = process.env.CIRC_SERVICE_URL   ?? 'http://localhost:3004';
const PATRON_URL = process.env.PATRON_SERVICE_URL  ?? 'http://localhost:3001';

export async function GET() {
  try {
    // Autenticar con el socio de demo
    const authRes = await fetch(`${PATRON_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sgomez@ucc.edu.co', password: 'Socio2026!' }),
    });

    if (!authRes.ok) return NextResponse.json({ data: [] });

    const authData = await authRes.json() as {
      accessToken: string;
      user: { id: string };
    };

    const patronId = authData.user.id;
    const token    = authData.accessToken;

    // Obtener todos los préstamos del socio (incluye activos y vencidos)
    const loanRes = await fetch(
      `${CIRC_URL}/api/v1/circulation/loans/patron/${patronId}?page=1&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!loanRes.ok) return NextResponse.json({ data: [] });

    const data = await loanRes.json() as { data: unknown[] };
    // Devolver solo préstamos activos/vencidos para el dashboard
    const activos = (data.data ?? []).filter(
      (l: any) => l.status === 'active' || l.status === 'overdue',
    );
    return NextResponse.json({ data: activos });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
