import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkLuciaAdmin, serverError } from '@/lib/luciaServer';
import { validateSegments, type LuciaSegment } from '@/lib/lucia';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = checkLuciaAdmin(req);
  if (denied) return denied;
  try {
    const db = getSupabaseAdmin();
    const [segRes, setRes] = await Promise.all([
      db.from('lucia_segments').select('position,label,kind,probability,stock,color').order('position'),
      db.from('lucia_settings').select('active,voucher_phrase,valid_until,legal_text').eq('id', 1).maybeSingle(),
    ]);
    if (segRes.error) throw segRes.error;
    if (setRes.error) throw setRes.error;
    const segments = (segRes.data ?? []).map((s) => ({ ...s, probability: Number(s.probability) })) as LuciaSegment[];
    return NextResponse.json({ segments, settings: setRes.data });
  } catch (err) {
    return serverError(err);
  }
}

const Segment = z.object({
  position: z.number().int().min(0).max(7),
  label: z.string().trim().min(1).max(40),
  kind: z.enum(['prize', 'lose']),
  probability: z.number().min(0).max(100),
  stock: z.number().int().min(0).nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const Body = z.object({
  segments: z.array(Segment).length(8),
  settings: z.object({
    active: z.boolean(),
    voucher_phrase: z.string().trim().min(1).max(80),
    valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    legal_text: z.string().trim().max(240),
  }),
});

export async function PUT(req: Request) {
  const denied = checkLuciaAdmin(req);
  if (denied) return denied;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: 'Datos inválidos.', details: String(e) }, { status: 400 });
  }
  const segments = body.segments.map((s) => (s.kind === 'lose' ? { ...s, probability: 0, stock: null } : s));
  const errors = validateSegments(segments);
  if (errors.length) return NextResponse.json({ error: errors.join(' ') }, { status: 400 });

  try {
    const db = getSupabaseAdmin();
    const now = new Date().toISOString();
    const segRes = await db.from('lucia_segments').upsert(segments.map((s) => ({ ...s, updated_at: now })));
    if (segRes.error) throw segRes.error;
    const setRes = await db.from('lucia_settings').upsert({ id: 1, ...body.settings, updated_at: now });
    if (setRes.error) throw setRes.error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
