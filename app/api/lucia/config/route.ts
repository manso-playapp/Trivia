import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { serverError } from '@/lib/luciaServer';
import type { PublicSegment } from '@/lib/lucia';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/** Configuración pública: gajos (sin % ni stock) y textos. */
export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const [segRes, setRes] = await Promise.all([
      db.from('lucia_segments').select('position,label,color').order('position'),
      db.from('lucia_settings').select('active,legal_text,valid_until').eq('id', 1).maybeSingle(),
    ]);
    if (segRes.error) throw segRes.error;
    if (setRes.error) throw setRes.error;
    return NextResponse.json(
      {
        segments: (segRes.data ?? []) as PublicSegment[],
        active: Boolean(setRes.data?.active),
        legal: setRes.data?.legal_text ?? '',
        valid_until: setRes.data?.valid_until ?? '',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return serverError(err);
  }
}
