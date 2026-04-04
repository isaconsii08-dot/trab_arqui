import { NextResponse } from 'next/server';

const CIRC_URL = process.env.CIRC_SERVICE_URL ?? 'http://localhost:3004';
const PATRON_URL = process.env.PATRON_SERVICE_URL ?? 'http://localhost:3001';

export async function GET() {
  try {
    // Autenticar con credenciales del socio de demo
    const authRes = await fetch(`${PATRON_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sgomez@ucc.edu.co', password: 'Socio2026!' }),
    });

    if (!authRes.ok) return NextResponse.json({ data: [] });

    const { accessToken, sub } = await authRes.json() as { accessToken: string; sub: string };

    const loanRes = await fetch(
      `${CIRC_URL}/api/v1/circulation/loans/active?patronId=${sub}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!loanRes.ok) return NextResponse.json({ data: [] });

    return NextResponse.json(await loanRes.json());
  } catch {
    return NextResponse.json({ data: [] });
  }
}
