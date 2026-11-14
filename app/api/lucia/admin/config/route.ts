import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkLuciaAdmin, serverError } from '@/lib/luciaServer';
import { parseEmailList, validateSegments, type LuciaSegment } from '@/lib/lucia';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
  const denied = checkLuciaAdmin(req);
  if (denied) return denied;
  try {
    const db = getSupabaseAdmin();
    const [segRes, setRes] = await Promise.all([
      db.from('lucia_segments').select('position,label,kind,probability,stock,color').order('position'),
      db.from('lucia_settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    if (segRes.error) throw segRes.error;
    if (setRes.error) throw setRes.error;
    const segments = (segRes.data ?? []).map((s) => ({ ...s, probability: Number(s.probability) })) as LuciaSegment[];
    const st = setRes.data ?? {};
    return NextResponse.json({
      segments,
      settings: {
        active: Boolean(st.active),
        voucher_phrase: st.voucher_phrase ?? '',
        valid_until: st.valid_until ?? '',
        legal_text: st.legal_text ?? '',
        test_emails: st.test_emails ?? '',
      },
    });
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
    test_emails: z.string().max(2000).optional().default(''),
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
    const settings = { ...body.settings, test_emails: parseEmailList(body.settings.test_emails).join(', ') };
    const setRes = await db.from('lucia_settings').upsert({ id: 1, ...settings, updated_at: now });
    if (setRes.error) {
      if (/test_emails/.test(setRes.error.message)) {
        return NextResponse.json(
          { error: 'Falta actualizar la base: ejecutá de nuevo supabase/lucia.sql en Supabase para habilitar los mails de prueba.' },
          { status: 500 },
        );
      }
      throw setRes.error;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
