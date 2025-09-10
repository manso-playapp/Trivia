import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const Body = z.object({
  tenantSlug: z.string().min(1),
  gameSlug: z.string().min(1),
  action: z.enum(['start','end']),
  idx: z.number().int().positive().optional(),
  durationSec: z.number().int().positive().max(600).optional(),
});

export async function POST(req: Request) {
  try {
    const secret = process.env.HOST_ADMIN_SECRET;
    if (secret) {
      const hdr = req.headers.get('x-admin-key');
      if (hdr !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantSlug, gameSlug, action, idx, durationSec } = Body.parse(await req.json());
    const admin = getSupabaseAdmin();

    const { data: tenant, error: tErr } = await admin.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle();
    if (tErr) throw tErr;
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const { data: game, error: gErr } = await admin
      .from('games')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('slug', gameSlug)
      .maybeSingle();
    if (gErr) throw gErr;
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    if (action === 'start') {
      if (!idx || !durationSec) return NextResponse.json({ error: 'idx and durationSec required' }, { status: 400 });
      const endsAt = new Date(Date.now() + durationSec * 1000).toISOString();
      const { error: uErr } = await admin
        .from('games')
        .update({ current_question_idx: idx, question_ends_at: endsAt })
        .eq('id', game.id);
      if (uErr) throw uErr;
      return NextResponse.json({ ok: true, endsAt });
    }

    if (action === 'end') {
      const { error: uErr } = await admin
        .from('games')
        .update({ question_ends_at: null })
        .eq('id', game.id);
      if (uErr) throw uErr;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    if (err?.issues) return NextResponse.json({ error: 'Invalid payload', details: err.issues }, { status: 400 });
    console.error('HOST_STATE', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
