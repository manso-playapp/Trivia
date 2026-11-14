import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/luciaServer';
import { normalizeEmail, normalizePhone, parseEmailList } from '@/lib/lucia';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const Body = z.object({ phone: z.string().max(40), email: z.string().max(120) });

/** Valida los datos antes de entrar al juego (no registra nada). */
export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Completá teléfono y mail.' }, { status: 400 });
  }
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);
  if (!phone) return NextResponse.json({ error: 'Revisá el teléfono (con código de área).', field: 'phone' }, { status: 400 });
  if (!email) return NextResponse.json({ error: 'Revisá el mail.', field: 'email' }, { status: 400 });

  try {
    const db = getSupabaseAdmin();
    const [settings, byPhone, byEmail] = await Promise.all([
      db.from('lucia_settings').select('*').eq('id', 1).maybeSingle(),
      db.from('lucia_players').select('id', { count: 'exact', head: true }).eq('phone', phone),
      db.from('lucia_players').select('id', { count: 'exact', head: true }).eq('email', email),
    ]);
    for (const r of [settings, byPhone, byEmail]) if (r.error) throw r.error;
    if (!settings.data?.active) {
      return NextResponse.json({ error: 'La promo no está activa en este momento.' }, { status: 403 });
    }
    if (parseEmailList(settings.data?.test_emails).includes(email)) return NextResponse.json({ ok: true, test: true });
    if (byPhone.count) return NextResponse.json({ error: 'Este teléfono ya participó. ¡Gracias por jugar!', field: 'phone' }, { status: 409 });
    if (byEmail.count) return NextResponse.json({ error: 'Este mail ya participó. ¡Gracias por jugar!', field: 'email' }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
