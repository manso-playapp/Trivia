"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function DisplayClient({ tenant, game }: { tenant: string; game: string }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [gameId, setGameId] = useState<string | null>(null);
  const [question, setQuestion] = useState<{ idx: number; text: string; options: any[] } | null>(null);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [qs, setQs] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [online, setOnline] = useState<number>(0);

  useEffect(() => {
    const init = async () => {
      const { data: t } = await supabase.from('tenants').select('id').eq('slug', tenant).maybeSingle();
      if (!t) return;
      const { data: g } = await supabase
        .from('games')
        .select('id,current_question_idx,question_ends_at')
        .eq('tenant_id', t.id)
        .eq('slug', game)
        .eq('status', 'published')
        .maybeSingle();
      if (!g) return;
      setGameId(g.id);
      const { data: list } = await supabase.rpc('get_public_questions', { p_game_id: g.id });
      setQs(list || []);
      if (g.current_question_idx) {
        const q = (list || []).find((x: any) => x.idx === g.current_question_idx);
        if (q) setQuestion({ idx: q.idx, text: q.text, options: q.options });
      }
      if (g.question_ends_at) setEndsAt(new Date(g.question_ends_at as any).getTime());
    };
    init();
  }, [tenant, game, supabase]);

  useEffect(() => {
    if (!gameId) return;
    const channel = supabase.channel(`game-${gameId}`, { config: { broadcast: { self: true }, presence: { key: `display-${Math.random().toString(36).slice(2)}` } } });
    channel.on('broadcast', { event: 'start_question' }, (payload) => {
      const { idx, endsAt: ea } = (payload as any).payload || {};
      const q = (qs as any[]).find((x) => x.idx === idx);
      if (q) setQuestion({ idx: q.idx, text: q.text, options: q.options });
      if (ea) setEndsAt(new Date(ea).getTime());
    });
    channel.on('broadcast', { event: 'end_question' }, () => {
      setEndsAt(null);
    });
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const count = Object.values(state).reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
      setOnline(count);
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') channel.track({ role: 'display' });
    });
    return () => {
      channel.unsubscribe();
    };
  }, [gameId, supabase, qs]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!endsAt) {
        setRemaining(0);
      } else {
        const diff = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        setRemaining(diff);
      }
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  // Poll leaderboard
  useEffect(() => {
    if (!gameId) return;
    let stop = false;
    const tick = async () => {
      const { data } = await supabase.rpc('get_leaderboard', { p_game_id: gameId, p_limit: 5 });
      if (!stop) setLeaders(data || []);
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => { stop = true; clearInterval(id); };
  }, [gameId, supabase]);

  return (
    <section style={{ marginTop: 24 }}>
      <div className="row">
        <h2 className="tv-title">Trivia</h2>
        <span className="tag">Online: {online}</span>
      </div>
      {question ? (
        <>
          <p className="tv-question">{question.idx}. {question.text}</p>
          {endsAt && <p className="tv-subtitle">Tiempo restante: {remaining}s</p>}
        </>
      ) : (
        <p className="tv-subtitle">Esperando inicio de pregunta…</p>
      )}
      {leaders.length > 0 && (
        <div style={{ marginTop: 24, textAlign: 'left' }}>
          <h3>Top 5</h3>
          <div className="list">
            {leaders.map((l: any) => (
              <div className="row" key={l.player_id}>#{l.rank} · {l.nickname} — {l.total_score} pts</div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
