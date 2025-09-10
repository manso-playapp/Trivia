"use client";
import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useEffect } from 'react';

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
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

  // Cargar una pregunta pública (demo: idx=1)
  useEffect(() => {
    const loadQuestion = async () => {
      try {
        const supabase = getSupabaseClient();
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
        const { data: qs } = await supabase.rpc('get_public_questions', { p_game_id: g.id });
        if (qs && qs.length > 0) {
          // demo: tomamos la primera (idx más bajo)
          const q = [...qs].sort((a: any, b: any) => a.idx - b.idx)[0];
          setQuestion({ id: q.id, idx: q.idx, text: q.text, options: q.options });
        }
      } catch {
        // noop
      }
    };
    loadQuestion();
  }, [tenant, game]);

  const submitAnswer = async (selectedIndex: number) => {
    if (!email || !question) return;
    setAnswering(true);
    setResult(null);
    try {
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
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: 8, borderRadius: 8 }}
            />
          </label>
          <label>
            Apodo
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              style={{ width: '100%', padding: 8, borderRadius: 8 }}
            />
          </label>
          <button disabled={loading} type="submit" style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff' }}>
            {loading ? 'Registrando…' : 'Registrarme'}
          </button>
          {error && <small style={{ color: 'tomato' }}>{error}</small>}
        </form>
      ) : (
        <section>
          <p>¡Registrado! Elegí tu respuesta:</p>
          {question ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <p style={{ color: 'var(--muted)' }}>Pregunta {question.idx}: {question.text}</p>
              {Array.isArray(question.options) && question.options.map((opt: any, i: number) => (
                <button key={i} disabled={answering} onClick={() => submitAnswer(i)} style={{ padding: '10px 14px', borderRadius: 8, background: '#1f2937', color: '#fff', textAlign: 'left' }}>
                  {String.fromCharCode(65 + i)}. {typeof opt === 'string' ? opt : JSON.stringify(opt)}
                </button>
              ))}
              {result && (
                <p style={{ color: result.isCorrect ? 'limegreen' : 'tomato' }}>
                  {result.isCorrect ? '¡Correcto!' : 'Incorrecto'} {typeof result.score === 'number' ? `(+${result.score} pts)` : ''}
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
