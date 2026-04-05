import { NextRequest, NextResponse } from 'next/server';

const PATRON_URL = process.env.PATRON_SERVICE_URL ?? 'http://localhost:3001';

// Traducciones de mensajes de validación de class-validator (inglés → español)
function traducirMensajes(messages: string | string[]): string {
  const lista = Array.isArray(messages) ? messages : [messages];
  const traducciones: [RegExp, string][] = [
    [/fullName should not be empty/i,       'El nombre completo es requerido'],
    [/fullName must be a string/i,           'El nombre debe ser texto'],
    [/email must be an email/i,              'El correo electrónico no es válido'],
    [/email should not be empty/i,           'El correo electrónico es requerido'],
    [/email already registered/i,            'Este correo ya está registrado'],
    [/email.*already.*use/i,                 'Este correo ya está en uso'],
    [/password must be longer than or equal to (\d+)/i, (_: string, n: string) => `La contraseña debe tener al menos ${n} caracteres`],
    [/password.*uppercase/i,                 'La contraseña debe tener al menos una letra mayúscula'],
    [/password.*lowercase/i,                 'La contraseña debe tener al menos una letra minúscula'],
    [/password.*number/i,                    'La contraseña debe contener al menos un número'],
    [/password.*special/i,                   'La contraseña debe contener al menos un carácter especial'],
    [/password must contain/i,               'La contraseña no cumple los requisitos de seguridad'],
    [/password should not be empty/i,        'La contraseña es requerida'],
    [/password must be a string/i,           'La contraseña debe ser texto'],
    [/phone must be a string/i,              'El teléfono debe ser texto'],
    [/address must be a string/i,            'La dirección debe ser texto'],
    [/libraryId should not be empty/i,       'La biblioteca es requerida'],
    [/libraryId must be a string/i,          'El ID de biblioteca debe ser texto'],
    [/property .* should not exist/i,        'Datos enviados no permitidos'],
    [/Duplicate entry/i,                     'Este correo ya está registrado'],
    [/unique constraint/i,                   'Este correo ya está registrado'],
  ];

  const traducidos = lista.map((msg) => {
    for (const [patron, trad] of traducciones) {
      if (typeof trad === 'string') {
        if (patron.test(msg)) return trad;
      } else {
        const match = msg.match(patron);
        if (match) return (trad as (...args: string[]) => string)(msg, ...match.slice(1));
      }
    }
    return msg; // si no hay traducción, devolver original
  });

  return [...new Set(traducidos)].join('. ');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const res = await fetch(`${PATRON_URL}/api/v1/patrons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as { message?: string | string[]; error?: string; statusCode?: number };

    if (!res.ok) {
      const msgEsp = traducirMensajes(data.message ?? data.error ?? 'Error al registrarse');
      return NextResponse.json({ message: msgEsp }, { status: res.status });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
