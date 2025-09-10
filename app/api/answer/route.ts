import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const Body = z.object({
  tenantSlug: z.string().min(1),
  gameSlug: z.string().min(1),
  email: z.string().email(),
  questionIdx: z.number().int().min(1),
  selectedIndex: z.number().int().min(0)
});

export async function POST(req: Request) {
  try {
    const { tenantSlug, gameSlug, email, questionIdx, selectedIndex } = Body.parse(await req.json());
    const admin = getSupabaseAdmin();

    // tenant
    const { data: tenant, error: tErr } = await admin.from('tenants').select('id, active').eq('slug', tenantSlug).maybeSingle();
    if (tErr) throw tErr;
    if (!tenant || !tenant.active) return NextResponse.json({ error: 'Tenant no disponible' }, { status: 404 });

    // game
    const { data: game, error: gErr } = await admin
      .from('games')
      .select('id, status, tenant_id')
      .eq('tenant_id', tenant.id)
      .eq('slug', gameSlug)
      .maybeSingle();
    if (gErr) throw gErr;
    if (!game || game.status !== 'published') return NextResponse.json({ error: 'Juego no publicado' }, { status: 403 });

    // question by idx
    const { data: question, error: qErr } = await admin
      .from('questions')
      .select('id, options, correct_index, points_base')
      .eq('game_id', game.id)
      .eq('idx', questionIdx)
      .maybeSingle();
    if (qErr) throw qErr;
    if (!question) return NextResponse.json({ error: 'Pregunta inexistente' }, { status: 404 });

    const optionsLen = Array.isArray(question.options) ? question.options.length : (question.options?.length ?? 0);
    if (selectedIndex < 0 || selectedIndex >= optionsLen) {
      return NextResponse.json({ error: 'Opción inválida' }, { status: 400 });
    }

    // ensure player exists (idempotente)
    const { data: playerExisting } = await admin
      .from('players')
      .select('id')
      .eq('game_id', game.id)
      .eq('email', email)
      .maybeSingle();

    let playerId = playerExisting?.id;
    if (!playerId) {
      const { data: created, error: pErr } = await admin
        .from('players')
        .insert({ game_id: game.id, email, nickname: email.split('@')[0] })
        .select('id')
        .single();
      if (pErr) throw pErr;
      playerId = created.id;
    }

    const isCorrect = selectedIndex === question.correct_index;
    const score = isCorrect ? (question.points_base ?? 100) : 0;

    const { error: insErr } = await admin
      .from('submissions')
      .insert({ player_id: playerId, question_id: question.id, selected_index: selectedIndex, is_correct: isCorrect, score_awarded: score });

    if (insErr) {
      // Unique violation means ya respondió
      if ((insErr as any).code === '23505') {
        return NextResponse.json({ ok: false, error: 'Ya respondiste esta pregunta' }, { status: 409 });
      }
      throw insErr;
    }

    return NextResponse.json({ ok: true, isCorrect, score });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: 'Payload inválido', details: err.issues }, { status: 400 });
    }
    console.error('ANSWER_POST', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

