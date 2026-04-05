import { NextRequest, NextResponse } from 'next/server';
import { autenticar } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };
    const resultado = await autenticar(email, password);

    if (!resultado) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const res = NextResponse.json({
      ok: true,
      accessToken: resultado.accessToken,
      role: resultado.role,
      sub: resultado.sub,
      fullName: resultado.fullName,
    });

    // Guardar token en cookie HTTP-only para SSR
    res.cookies.set('bf_token', resultado.accessToken, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });
    res.cookies.set('bf_user', JSON.stringify({ sub: resultado.sub, role: resultado.role, fullName: resultado.fullName }), {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
