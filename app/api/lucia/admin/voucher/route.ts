import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkLuciaAdmin, serverError } from '@/lib/luciaServer';

export const dynamic = 'force-dynamic';

const COLS = 'created_at,phone,email,prize_label,voucher_code,redeemed_at';
const clean = (c: string) => c.trim().toUpperCase().replace(/\s+/g, '');

/** Consultar un voucher: GET ?code=LU-XXXXXX */
export async function GET(req: Request) {
  const denied = checkLuciaAdmin(req);
  if (denied) return denied;
  const code = clean(new URL(req.url).searchParams.get('code') || '');
  if (!code) return NextResponse.json({ error: 'Ingresá un código.' }, { status: 400 });
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('lucia_players').select(COLS).eq('voucher_code', code).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'No existe un voucher con ese código.' }, { status: 404 });
    return NextResponse.json({ voucher: data });
  } catch (err) {
    return serverError(err);
  }
}

const Body = z.object({ code: z.string().min(1).max(20), redeemed: z.boolean() });

/** Marcar / desmarcar como canjeado */
export async function POST(req: Request) {
  const denied = checkLuciaAdmin(req);
  if (denied) return denied;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('lucia_players')
      .update({ redeemed_at: body.redeemed ? new Date().toISOString() : null })
      .eq('voucher_code', clean(body.code))
      .select(COLS)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'No existe un voucher con ese código.' }, { status: 404 });
    return NextResponse.json({ voucher: data });
  } catch (err) {
    return serverError(err);
  }
}
