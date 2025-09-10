import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const Body = z.object({
  tenantSlug: z.string().min(1),
  gameSlug: z.string().min(1),
  email: z.string().email(),
  nickname: z.string().min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { tenantSlug, gameSlug, email, nickname } = Body.parse(json);
    const admin = getSupabaseAdmin();

    // Busca game.id por tenant+slug y exige status published
    const { data: game, error: gameErr } = await admin
      .from('games')
      .select('id, status, tenant_id, slug')
      .eq('slug', gameSlug)
      .in('tenant_id', (
        await admin.from('tenants').select('id').eq('slug', tenantSlug)
      ).data?.map((t: any) => t.id) || [])
      .maybeSingle();

    if (gameErr) throw gameErr;
    if (!game) return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 });
    if (game.status !== 'published') {
      return NextResponse.json({ error: 'Juego no publicado' }, { status: 403 });
    }

    // Crea jugador (idempotente por (game_id,email))
    const { data: player, error: insErr } = await admin
      .from('players')
      .insert({ game_id: game.id, email, nickname })
      .select('id')
      .single();

    if (insErr && insErr.code !== '23505') { // unique_violation
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    // Si ya existía, recupéralo
    let playerId = player?.id;
    if (!playerId) {
      const { data: existing } = await admin
        .from('players')
        .select('id')
        .eq('game_id', game.id)
        .eq('email', email)
        .maybeSingle();
      playerId = existing?.id;
    }

    return NextResponse.json({ ok: true, gameId: game.id, playerId });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: 'Payload inválido', details: err.issues }, { status: 400 });
    }
    console.error('JOIN_POST', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

