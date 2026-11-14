import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkLuciaAdmin, serverError } from '@/lib/luciaServer';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const COLS = 'id,created_at,phone,email,won,prize_label,voucher_code,redeemed_at';

type Row = {
  id: string;
  created_at: string;
  phone: string;
  email: string;
  won: boolean;
  prize_label: string | null;
  voucher_code: string | null;
  redeemed_at: string | null;
};

/** Lista de jugadores. ?format=csv descarga un CSV (separador ; para Excel en español). */
export async function GET(req: Request) {
  const denied = checkLuciaAdmin(req);
  if (denied) return denied;
  try {
    const db = getSupabaseAdmin();
    const rows: Row[] = [];
    // Pagina de a 1000 (límite por request de Supabase)
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db
        .from('lucia_players')
        .select(COLS)
        .order('created_at', { ascending: false })
        .range(from, from + 999);
      if (error) throw error;
      rows.push(...((data ?? []) as Row[]));
      if (!data || data.length < 1000) break;
    }

    const format = new URL(req.url).searchParams.get('format');
    if (format === 'csv') {
      const fmt = (iso: string | null) =>
        iso ? new Date(iso).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : '';
      const esc = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
      const header = ['Fecha', 'Teléfono', 'Mail', 'Ganó', 'Premio', 'Código', 'Canjeado'];
      const lines = rows.map((r) =>
        [fmt(r.created_at), r.phone, r.email, r.won ? 'Sí' : 'No', r.prize_label ?? '', r.voucher_code ?? '', fmt(r.redeemed_at)]
          .map((v) => esc(String(v)))
          .join(';'),
      );
      const csv = '﻿' + [header.join(';'), ...lines].join('\r\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="lucia-jugadores-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    return NextResponse.json({ players: rows });
  } catch (err) {
    return serverError(err);
  }
}

/** Eliminar un participante: DELETE ?id=<uuid> */
export async function DELETE(req: Request) {
  const denied = checkLuciaAdmin(req);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Participante inválido.' }, { status: 400 });
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('lucia_players').delete().eq('id', id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'No existe ese participante.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
