import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/** Verifica la clave del panel (header x-admin-secret). Nunca abre si falta la env. */
export function checkLuciaAdmin(req: Request): NextResponse | null {
  const secret = process.env.LUCIA_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Falta configurar LUCIA_ADMIN_SECRET en el servidor.' }, { status: 500 });
  }
  const given = req.headers.get('x-admin-secret') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Clave incorrecta.' }, { status: 401 });
  }
  return null;
}

export function serverError(err: unknown) {
  const message = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : 'Error inesperado';
  console.error('[lucia]', err);
  return NextResponse.json({ error: message }, { status: 500 });
}
