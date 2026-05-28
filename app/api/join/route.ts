import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { Game, Player, Tenant } from '@/types';

const Body = z.object({
  tenantSlug: z.string().min(1),
  gameSlug: z.string().min(1),
  email: z.string().email(),
  nickname: z.string().min(1).max(50),
});

type TenantIdRow = Pick<Tenant, 'id'>;
type GameRow = Pick<Game, 'id' | 'status' | 'tenant_id' | 'slug'>;
type PlayerIdRow = Pick<Player, 'id'>;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { tenantSlug, gameSlug, email, nickname } = Body.parse(json);
    const admin = getSupabaseAdmin();

    // Busca game.id por tenant+slug y exige status published
    const tenantsRes = await admin.from('tenants').select('id').eq('slug', tenantSlug);
    const tenantIds = ((tenantsRes.data as TenantIdRow[] | null) ?? []).map((t) => t.id);

    const { data: gameData, error: gameErr } = await admin
      .from('games')
      .select('id, status, tenant_id, slug')
      .eq('slug', gameSlug)
      .in('tenant_id', tenantIds)
      .maybeSingle();

    if (gameErr) throw gameErr;
    const game = gameData as GameRow | null;
    if (!game) return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 });
    if (game.status !== 'published') {
      return NextResponse.json({ error: 'Juego no publicado' }, { status: 403 });
    }

    // Crea jugador (idempotente por (game_id,email))
    const { data: playerData, error: insErr } = await admin
      .from('players')
      .insert({ game_id: game.id, email, nickname })
      .select('id')
      .single();

    if (insErr && insErr.code !== '23505') { // unique_violation
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    const player = playerData as PlayerIdRow | null;

    // Si ya existía, recupéralo
    let playerId: string | undefined = player?.id;
    if (!playerId) {
      const { data: existingData } = await admin
        .from('players')
        .select('id')
        .eq('game_id', game.id)
        .eq('email', email)
        .maybeSingle();
      const existing = existingData as PlayerIdRow | null;
      playerId = existing?.id;
    }

    return NextResponse.json({ ok: true, gameId: game.id, playerId });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Payload inválido', details: err.issues }, { status: 400 });
    }
    console.error('JOIN_POST', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
