"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Props = { params: { tenant: string; game: string } };

export default function HostConsole({ params }: Props) {
  const { tenant, game } = params;
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [gameId, setGameId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Array<{ id: string; idx: number; text: string }>>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(1);
  const [duration, setDuration] = useState<number>(20);
  const [channelJoined, setChannelJoined] = useState(false);
  const [playersOnline, setPlayersOnline] = useState<number>(0);

  // Resolve game id and load questions
  useEffect(() => {
    const init = async () => {
      // tenant id
      const { data: t } = await supabase.from('tenants').select('id').eq('slug', tenant).maybeSingle();
      if (!t) return;
      const { data: g } = await supabase
        .from('games')
        .select('id')
        .eq('tenant_id', t.id)
        .eq('slug', game)
        .eq('status', 'published')
        .maybeSingle();
      if (!g) return;
      setGameId(g.id);
      const { data: qs } = await supabase.rpc('get_public_questions', { p_game_id: g.id });
      if (qs) {
        const mapped = (qs as any[]).map((q) => ({ id: q.id as string, idx: q.idx as number, text: q.text as string }));
        setQuestions(mapped.sort((a, b) => a.idx - b.idx));
        if (mapped.length) setSelectedIdx(mapped[0].idx);
      }
    };
    init();
  }, [tenant, game, supabase]);

  // Join realtime channel with presence
  useEffect(() => {
    if (!gameId) return;
    const channel = supabase.channel(`game-${gameId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: `host-${Math.random().toString(36).slice(2)}` },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      // Count unique presence entries (players+host)
      const count = Object.values(state).reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
      setPlayersOnline(count);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ role: 'host' });
        setChannelJoined(true);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [gameId, supabase]);

  const startQuestion = async () => {
    if (!gameId) return;
    const endsAt = new Date(Date.now() + duration * 1000).toISOString();
    await supabase.channel(`game-${gameId}`).send({
      type: 'broadcast',
      event: 'start_question',
      payload: { idx: selectedIdx, endsAt },
    });
    // Persistir estado (requiere HOST_ADMIN_SECRET en headers)
    try {
      await fetch('/api/host/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug: tenant, gameSlug: game, action: 'start', idx: selectedIdx, durationSec: duration }),
      });
    } catch {}
  };

  const endQuestion = async () => {
    if (!gameId) return;
    await supabase.channel(`game-${gameId}`).send({
      type: 'broadcast',
      event: 'end_question',
      payload: { idx: selectedIdx },
    });
    try {
      await fetch('/api/host/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug: tenant, gameSlug: game, action: 'end' }),
      });
    } catch {}
  };

  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <h1>Host: {tenant}/{game}</h1>
      {!gameId ? (
        <p style={{ color: 'var(--muted)' }}>Cargando juego…</p>
      ) : (
        <>
          <p style={{ color: 'var(--muted)' }}>Canal: game-{gameId} · Online: {playersOnline}</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              Pregunta
              <select value={selectedIdx} onChange={(e) => setSelectedIdx(Number(e.target.value))} style={{ marginLeft: 8 }}>
                {questions.map((q) => (
                  <option key={q.id} value={q.idx}>
                    {q.idx} — {q.text.slice(0, 40)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Duración (s)
              <input type="number" min={5} max={120} value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ width: 80, marginLeft: 8 }} />
            </label>
            <button disabled={!channelJoined} onClick={startQuestion} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff' }}>Start</button>
            <button disabled={!channelJoined} onClick={endQuestion} style={{ padding: '10px 14px', borderRadius: 8, background: '#ef4444', color: '#fff' }}>End</button>
          </div>
        </>
      )}
    </main>
  );
}
