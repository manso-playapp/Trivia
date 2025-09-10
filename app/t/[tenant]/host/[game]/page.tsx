"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Props = { params: { tenant: string; game: string } };

export default function HostConsole({ params }: Props) {
  const { tenant, game } = params;
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Array<{ id: string; idx: number; text: string }>>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(1);
  const [duration, setDuration] = useState<number>(20);
  const [channelJoined, setChannelJoined] = useState(false);
  const [playersOnline, setPlayersOnline] = useState<number>(0);
  const [status, setStatus] = useState<string>("");

  // Check auth session
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSignedIn(!!data.session);
        setSessionReady(true);
      }
      const { data: sub } = supabase.auth.onAuthStateChange((_ev, sess) => {
        setSignedIn(!!sess);
      });
      return () => sub.subscription.unsubscribe();
    })();
    return () => { mounted = false; };
  }, [supabase]);

  // Resolve game id and load questions
  useEffect(() => {
    if (!signedIn) return;
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
  }, [tenant, game, supabase, signedIn]);

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
      setStatus(`Pregunta ${selectedIdx} iniciada (${duration}s)`);
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
      setStatus(`Pregunta ${selectedIdx} finalizada`);
    } catch {}
  };

  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <h1>Host: {tenant}/{game}</h1>
      {!sessionReady ? (
        <p className="muted">Verificando sesión…</p>
      ) : !signedIn ? (
        <p><a className="btn btn-primary" href="/login">Ingresar</a></p>
      ) : !gameId ? (
        <p style={{ color: 'var(--muted)' }}>Cargando juego…</p>
      ) : (
        <>
          <p style={{ color: 'var(--muted)' }}>Canal: game-{gameId} · Online: {playersOnline}</p>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <a className="btn btn-ghost" href="#" onClick={async (e) => { e.preventDefault(); await supabase.auth.signOut(); }}>Salir</a>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <label className="row">
              <span className="label">Pregunta</span>
              <select value={selectedIdx} onChange={(e) => setSelectedIdx(Number(e.target.value))} className="input" style={{ width: 280 }}>
                {questions.map((q) => (
                  <option key={q.id} value={q.idx}>
                    {q.idx} — {q.text.slice(0, 40)}
                  </option>
                ))}
              </select>
            </label>
            <label className="row">
              <span className="label">Duración (s)</span>
              <input type="number" min={5} max={120} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input" style={{ width: 120 }} />
            </label>
            <button disabled={!channelJoined} onClick={startQuestion} className="btn btn-primary">Start</button>
            <button disabled={!channelJoined} onClick={endQuestion} className="btn btn-danger">End</button>
          </div>
          {status && <p className="muted" aria-live="polite">{status}</p>}
        </>
      )}
    </main>
  );
}
