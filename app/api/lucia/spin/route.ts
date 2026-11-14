import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/luciaServer';
import { randomInt } from 'crypto';
import { drawSegment, normalizeEmail, normalizePhone, parseEmailList, type LuciaSegment, type SpinResult } from '@/lib/lucia';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const Body = z.object({
  phone: z.string().max(40),
  email: z.string().max(120),
  accept: z.literal(true),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Completá teléfono, mail y aceptá las bases.' }, { status: 400 });
  }
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);
  if (!phone) return NextResponse.json({ error: 'El teléfono no parece válido.', field: 'phone' }, { status: 400 });
  if (!email) return NextResponse.json({ error: 'El mail no parece válido.', field: 'email' }, { status: 400 });

  try {
    const db = getSupabaseAdmin();

    // Mails de prueba: se sortea igual, pero no se guarda nada ni se descuenta stock.
    const { data: settings, error: setErr } = await db.from('lucia_settings').select('*').eq('id', 1).maybeSingle();
    if (setErr) throw setErr;
    if (parseEmailList(settings?.test_emails).includes(email)) {
      const { data: segs, error: segErr } = await db
        .from('lucia_segments')
        .select('position,label,kind,probability,stock,color')
        .order('position');
      if (segErr) throw segErr;
      const segments = (segs ?? []).map((s) => ({ ...s, probability: Number(s.probability) })) as LuciaSegment[];
      const pick = drawSegment(segments, randomInt(0, 1_000_000) / 10_000, randomInt(0, 1_000_000) / 1_000_000);
      if (!pick) return NextResponse.json({ error: 'La ruleta no está bien configurada.' }, { status: 500 });
      const won = pick.kind === 'prize';
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code = won ? 'PRUEBA-' + Array.from({ length: 4 }, () => alphabet[randomInt(0, alphabet.length)]).join('') : null;
      const result: SpinResult = {
        position: pick.position,
        label: pick.label,
        won,
        code,
        phrase: settings?.voucher_phrase ?? '',
        legal: settings?.legal_text ?? '',
        valid_until: settings?.valid_until ?? '',
        test: true,
      };
      return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
    }

    const { data, error } = await db.rpc('lucia_spin', {
      p_phone: phone,
      p_email: email,
      p_user_agent: req.headers.get('user-agent'),
    });
    if (error) throw error;
    const res = data as (SpinResult & { error?: undefined }) | { error: string; field?: string };
    if (res.error) {
      if (res.error === 'already_played') {
        const which = 'field' in res && res.field === 'email' ? 'Este mail' : 'Este teléfono';
        return NextResponse.json({ error: `${which} ya participó. ¡Gracias por jugar!`, code: 'already_played' }, { status: 409 });
      }
      if (res.error === 'inactive') {
        return NextResponse.json({ error: 'La promo no está activa en este momento.', code: 'inactive' }, { status: 403 });
      }
      return NextResponse.json({ error: 'La ruleta no está bien configurada.', code: res.error }, { status: 500 });
    }
    return NextResponse.json(res, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return serverError(err);
  }
}
