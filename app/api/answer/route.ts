import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { Game, Player, Question, Tenant } from '@/types';

const Body = z.object({
  tenantSlug: z.string().min(1),
  gameSlug: z.string().min(1),
  email: z.string().email(),
  questionIdx: z.number().int().min(1),
  selectedIndex: z.number().int().min(0)
});

type TenantRow = Pick<Tenant, 'id' | 'active'>;
type GameRow = Pick<Game, 'id' | 'status' | 'tenant_id' | 'current_question_idx' | 'question_ends_at'>;
type QuestionRow = Pick<Question, 'id' | 'options' | 'correct_index' | 'points_base' | 'points_time_factor' | 'time_limit_sec'>;
type PlayerIdRow = Pick<Player, 'id'>;

export async function POST(req: Request) {
  try {
    const { tenantSlug, gameSlug, email, questionIdx, selectedIndex } = Body.parse(await req.json());
    const admin = getSupabaseAdmin();

    // tenant
    const { data: tenantData, error: tErr } = await admin.from('tenants').select('id, active').eq('slug', tenantSlug).maybeSingle();
    if (tErr) throw tErr;
    const tenant = tenantData as TenantRow | null;
    if (!tenant || !tenant.active) return NextResponse.json({ error: 'Tenant no disponible' }, { status: 404 });

    // game
    const { data: gameData, error: gErr } = await admin
      .from('games')
      .select('id, status, tenant_id, current_question_idx, question_ends_at')
      .eq('tenant_id', tenant.id)
      .eq('slug', gameSlug)
      .maybeSingle();
    if (gErr) throw gErr;
    const game = gameData as GameRow | null;
    if (!game || game.status !== 'published') return NextResponse.json({ error: 'Juego no publicado' }, { status: 403 });

    // Validate active window and question idx
    const now = new Date();
    if (game.current_question_idx == null || game.current_question_idx !== questionIdx) {
      return NextResponse.json({ error: 'Pregunta no activa' }, { status: 403 });
    }
    if (!game.question_ends_at || new Date(game.question_ends_at) < now) {
      return NextResponse.json({ error: 'Ventana de respuesta cerrada' }, { status: 403 });
    }

    // question by idx
    const { data: questionData, error: qErr } = await admin
      .from('questions')
      .select('id, options, correct_index, points_base, points_time_factor, time_limit_sec')
      .eq('game_id', game.id)
      .eq('idx', questionIdx)
      .maybeSingle();
    if (qErr) throw qErr;
    const question = questionData as QuestionRow | null;
    if (!question) return NextResponse.json({ error: 'Pregunta inexistente' }, { status: 404 });

    const optionsLen = Array.isArray(question.options) ? question.options.length : 0;
    if (selectedIndex < 0 || selectedIndex >= optionsLen) {
      return NextResponse.json({ error: 'Opción inválida' }, { status: 400 });
    }

    // ensure player exists (idempotente)
    const { data: playerExistingData } = await admin
      .from('players')
      .select('id')
      .eq('game_id', game.id)
      .eq('email', email)
      .maybeSingle();

    const playerExisting = playerExistingData as PlayerIdRow | null;
    let playerId: string | undefined = playerExisting?.id;
    if (!playerId) {
      const { data: createdData, error: pErr } = await admin
        .from('players')
        .insert({ game_id: game.id, email, nickname: email.split('@')[0] })
        .select('id')
        .single();
      if (pErr) throw pErr;
      const created = createdData as PlayerIdRow;
      playerId = created.id;
    }

    const isCorrect = selectedIndex === question.correct_index;
    let score = 0;
    if (isCorrect) {
      const endsAt = new Date(game.question_ends_at).getTime();
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      const base = question.points_base ?? 100;
      const factor = question.points_time_factor ?? 0;
      score = base + factor * remaining;
    }

    const { error: insErr } = await admin
      .from('submissions')
      .insert({ player_id: playerId, question_id: question.id, selected_index: selectedIndex, is_correct: isCorrect, score_awarded: score });

    if (insErr) {
      // Unique violation means ya respondió
      if (typeof insErr === 'object' && insErr !== null && 'code' in insErr && (insErr as { code?: string }).code === '23505') {
        return NextResponse.json({ ok: false, error: 'Ya respondiste esta pregunta' }, { status: 409 });
      }
      throw insErr;
    }

    return NextResponse.json({ ok: true, isCorrect, score });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Payload inválido', details: err.issues }, { status: 400 });
    }
    console.error('ANSWER_POST', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
