import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/luciaServer';
import { normalizeEmail, normalizePhone } from '@/lib/lucia';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const Body = z.object({
  phone: z.string().max(40).optional(),
  email: z.string().max(120).optional(),
  code: z.string().max(20).optional(),
});

/**
 * ¿Sigue existiendo la participación guardada en el celular?
 * Si se eliminó desde el panel, el juego borra su copia local y vuelve al formulario.
 * Sólo responde sí/no: no devuelve datos del participante.
 */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }
  const phone = body.phone ? normalizePhone(body.phone) : null;
  const email = body.email ? normalizeEmail(body.email) : null;
  const code = body.code?.trim().toUpperCase() || null;
  if (!phone && !email && !code) return NextResponse.json({ exists: false });

  try {
    const db = getSupabaseAdmin();
    // Coincide si existe el mismo teléfono, mail o código (consultas separadas, sin armar filtros a mano)
    const checks = (
      [
        ['phone', phone],
        ['email', email],
        ['voucher_code', code],
      ] as const
    ).filter(([, v]) => v);
    const results = await Promise.all(
      checks.map(([col, v]) => db.from('lucia_players').select('id', { count: 'exact', head: true }).eq(col, v as string)),
    );
    for (const r of results) if (r.error) throw r.error;
    const count = results.reduce((acc, r) => acc + (r.count ?? 0), 0);
    return NextResponse.json({ exists: (count ?? 0) > 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return serverError(err);
  }
}
