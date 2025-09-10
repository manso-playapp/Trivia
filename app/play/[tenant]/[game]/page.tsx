"use client";
import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useEffect, useMemo } from 'react';

type Props = { params: { tenant: string; game: string } };

export default function PlaySlugPage({ params }: Props) {
  const { tenant, game } = params;
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<{ id: string; idx: number; text: string; options: any[] } | null>(null);
  const [answering, setAnswering] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; isCorrect?: boolean; score?: number } | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [appliedTheme, setAppliedTheme] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1) obtener tenant id por slug
      const { data: t, error: tErr } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenant)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!t) throw new Error('Tenant no encontrado');

      // 2) obtener game id por slug y tenant, solo si published
      const { data: g, error: gErr } = await supabase
        .from('games')
        .select('id')
        .eq('tenant_id', t.id)
        .eq('slug', game)
        .eq('status', 'published')
        .maybeSingle();
      if (gErr) throw gErr;
      if (!g) throw new Error('Juego no publicado o inexistente');
      setGameId(g.id);

      // 3) insertar player (RLS permite si game está published)
      const { error: pErr } = await supabase
        .from('players')
        .insert({ game_id: g.id, email, nickname });
      if (pErr && pErr.code !== '23505') throw pErr; // permitir si ya existe

      setRegistered(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar preguntas públicas y suscribirse a Realtime
  useEffect(() => {
    const loadQuestion = async () => {
      try {
        // tenant id -> game id
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
        const { data: qs } = await supabase.rpc('get_public_questions', { p_game_id: g.id });
        setQuestions(qs || []);
        if (g.current_question_idx && qs && qs.length) {
          const q = (qs as any[]).find((x) => x.idx === g.current_question_idx);
          if (q) setQuestion({ id: q.id, idx: q.idx, text: q.text, options: q.options });
        }
        if ((g as any).question_ends_at) setEndsAt(new Date((g as any).question_ends_at).getTime());
      } catch {}
    };
    loadQuestion();
  }, [tenant, game, supabase]);

  useEffect(() => {
    if (!gameId) return;
    const channel = supabase.channel(`game-${gameId}`, { config: { broadcast: { self: true } } });
    channel.on('broadcast', { event: 'start_question' }, (payload) => {
      const { idx, endsAt } = (payload as any).payload || {};
      const q = (questions as any[]).find((x) => x.idx === idx);
      if (q) setQuestion({ id: q.id, idx: q.idx, text: q.text, options: q.options });
      setResult(null);
      if (endsAt) setEndsAt(new Date(endsAt).getTime());
      setAnswering(false);
    });
    channel.on('broadcast', { event: 'end_question' }, () => {
      // lock answering on end
      setAnswering(false);
      setEndsAt(null);
    });
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [gameId, supabase, questions]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!endsAt) { setRemaining(0); return; }
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  // Apply theme CSS variables client-side
  useEffect(() => {
    (async () => {
      try {
        const { data: t } = await supabase.from('tenants').select('id').eq('slug', tenant).maybeSingle();
        if (!t) return;
        const { data: g } = await supabase
          .from('games')
          .select('id, theme_id')
          .eq('tenant_id', t.id)
          .eq('slug', game)
          .eq('status', 'published')
          .maybeSingle();
        if (!g || !g.theme_id) return;
        const { data: theme } = await supabase
          .from('themes')
          .select('css_vars')
          .eq('id', g.theme_id)
          .maybeSingle();
        const vars = (theme as any)?.css_vars || {};
        const root = document.documentElement;
        Object.entries(vars).forEach(([k, v]) => {
          if (typeof v === 'string') root.style.setProperty(k, v);
        });
        setAppliedTheme(true);
      } catch {}
    })();
  }, [tenant, game, supabase]);

  const submitAnswer = async (selectedIndex: number) => {
    if (!email || !question) return;
    setAnswering(true);
    setResult(null);
    try {
      if (endsAt && Date.now() > endsAt) {
        setResult({ ok: false });
        setAnswering(false);
        return;
      }
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug: tenant, gameSlug: game, email, questionIdx: question.idx, selectedIndex }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo enviar la respuesta');
      setResult(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnswering(false);
    }
  };

  return (
    <main className="container">
      <h1>Unite a: {tenant}/{game}</h1>
      {!registered ? (
        <form onSubmit={onSubmit} className="card" style={{ maxWidth: 420 }}>
          <div className="stack">
            <div>
              <span className="label">Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <span className="label">Apodo</span>
              <input className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
            </div>
            <button disabled={loading} type="submit" className="btn btn-primary">
              {loading ? (<><span className="spinner" /> Registrando…</>) : 'Registrarme'}
            </button>
            {error && <small style={{ color: 'tomato' }}>{error}</small>}
            <small className="muted">Tus datos se usan solo para el juego.</small>
          </div>
        </form>
      ) : (
        <section className="stack">
          <div className="row" aria-live="polite">
            <span className="tag">Registrado</span>
            {endsAt ? <span className="muted">Tiempo restante: {remaining}s</span> : <span className="muted">Esperando inicio…</span>}
          </div>
          <p>Elegí tu respuesta:</p>
          {question ? (
            <div className="stack">
              <p className="muted">Pregunta {question.idx}: {question.text}</p>
              {Array.isArray(question.options) && question.options.map((opt: any, i: number) => (
                <button key={i} disabled={answering || (endsAt ? Date.now() > endsAt : true)} onClick={() => submitAnswer(i)} className="btn opt">
                  {String.fromCharCode(65 + i)}. {typeof opt === 'string' ? opt : JSON.stringify(opt)}
                </button>
              ))}
              {result && (
                <p aria-live="polite" style={{ color: result.isCorrect ? 'limegreen' : 'tomato' }}>
                  {result.isCorrect ? '¡Correcto!' : 'Respuesta registrada'} {typeof result.score === 'number' ? `(+${result.score} pts)` : ''}
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)' }}>Esperando preguntas…</p>
          )}
        </section>
      )}
    </main>
  );
}
