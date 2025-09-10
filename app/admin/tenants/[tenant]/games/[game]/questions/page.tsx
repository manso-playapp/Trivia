"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Papa from 'papaparse';

type Question = {
  id: string;
  idx: number;
  text: string;
  options: any[];
  correct_index: number;
  time_limit_sec: number;
  points_base: number;
  points_time_factor: number;
};

export default function QuestionsAdmin({ params }: { params: { tenant: string; game: string } }) {
  const { tenant, game } = params;
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    idx: 1,
    text: '',
    options: ['', '', '', ''],
    correct_index: 0,
    time_limit_sec: 20,
    points_base: 100,
    points_time_factor: 2,
  });
  const [saving, setSaving] = useState(false);
  const [replaceAll, setReplaceAll] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: t, error: tErr } = await supabase.from('tenants').select('id').eq('slug', tenant).maybeSingle();
        if (tErr) throw tErr;
        if (!t) throw new Error('Tenant no encontrado');
        setTenantId(t.id);
        const { data: g, error: gErr } = await supabase
          .from('games')
          .select('id')
          .eq('tenant_id', t.id)
          .eq('slug', game)
          .maybeSingle();
        if (gErr) throw gErr;
        if (!g) throw new Error('Juego no encontrado');
        setGameId(g.id);
        const { data: qs, error: qErr } = await supabase
          .from('questions')
          .select('id, idx, text, options, correct_index, time_limit_sec, points_base, points_time_factor')
          .eq('game_id', g.id)
          .order('idx', { ascending: true });
        if (qErr) throw qErr;
        setQuestions((qs as any) || []);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [tenant, game, supabase]);

  async function refresh() {
    if (!gameId) return;
    const { data } = await supabase
      .from('questions')
      .select('id, idx, text, options, correct_index, time_limit_sec, points_base, points_time_factor')
      .eq('game_id', gameId)
      .order('idx', { ascending: true });
    setQuestions((data as any) || []);
  }

  async function createQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!gameId) return;
    setSaving(true);
    try {
      const payload = {
        game_id: gameId,
        idx: Number(form.idx),
        text: form.text,
        options: form.options,
        correct_index: Number(form.correct_index),
        time_limit_sec: Number(form.time_limit_sec),
        points_base: Number(form.points_base),
        points_time_factor: Number(form.points_time_factor),
      };
      const { error } = await supabase.from('questions').insert(payload);
      if (error) throw error;
      setForm({ idx: form.idx + 1, text: '', options: ['', '', '', ''], correct_index: 0, time_limit_sec: 20, points_base: 100, points_time_factor: 2 });
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateQuestion(q: Question, patch: Partial<Question>) {
    const { error } = await supabase.from('questions').update(patch).eq('id', q.id);
    if (!error) await refresh();
  }

  async function deleteQuestion(q: Question) {
    if (!confirm(`Eliminar pregunta ${q.idx}?`)) return;
    const { error } = await supabase.from('questions').delete().eq('id', q.id);
    if (!error) await refresh();
  }

  function onCsvFile(file: File) {
    if (!gameId) return;
    setErr(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        try {
          const rows = res.data as any[];
          if (!Array.isArray(rows) || rows.length === 0) {
            setErr('CSV vacío o inválido');
            return;
          }
          // Expected headers: idx,text,option_a,option_b,option_c,option_d,correct_index,time_limit_sec,points_base,points_time_factor
          const payload = rows.map((r) => ({
            game_id: gameId,
            idx: Number(r.idx),
            text: String(r.text ?? ''),
            options: [r.option_a, r.option_b, r.option_c, r.option_d].map((x) => (x ?? '').toString()),
            correct_index: Number(r.correct_index ?? 0),
            time_limit_sec: Number(r.time_limit_sec ?? 20),
            points_base: Number(r.points_base ?? 100),
            points_time_factor: Number(r.points_time_factor ?? 2),
          }));
          if (replaceAll) {
            await supabase.from('questions').delete().eq('game_id', gameId);
          }
          const { error } = await supabase.from('questions').insert(payload);
          if (error) throw error;
          await refresh();
        } catch (e: any) {
          setErr(e.message);
        }
      },
      error: (e) => setErr(e.message),
    });
  }

  if (loading) return <main className="container"><p className="muted">Cargando…</p></main>;
  if (err) return <main className="container"><p style={{ color: 'tomato' }}>{err}</p></main>;

  return (
    <main className="container">
      <h1 className="heading">Preguntas — {tenant}/{game}</h1>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Crear pregunta</h2>
        <form onSubmit={createQuestion} className="stack">
          <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
            <label>
              <span className="label">Índice</span>
              <input className="input" type="number" min={1} value={form.idx} onChange={(e) => setForm({ ...form, idx: Number(e.target.value) })} style={{ width: 120 }} />
            </label>
            <label>
              <span className="label">Tiempo (s)</span>
              <input className="input" type="number" min={5} value={form.time_limit_sec} onChange={(e) => setForm({ ...form, time_limit_sec: Number(e.target.value) })} style={{ width: 120 }} />
            </label>
            <label>
              <span className="label">Puntos base</span>
              <input className="input" type="number" min={0} value={form.points_base} onChange={(e) => setForm({ ...form, points_base: Number(e.target.value) })} style={{ width: 140 }} />
            </label>
            <label>
              <span className="label">Factor tiempo</span>
              <input className="input" type="number" min={0} value={form.points_time_factor} onChange={(e) => setForm({ ...form, points_time_factor: Number(e.target.value) })} style={{ width: 140 }} />
            </label>
          </div>
          <div>
            <span className="label">Enunciado</span>
            <input className="input" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
          </div>
          <div className="stack">
            {form.options.map((opt, i) => (
              <div className="row" key={i}>
                <span className="label" style={{ width: 28 }}>{String.fromCharCode(65 + i)}</span>
                <input className="input" value={opt} onChange={(e) => {
                  const arr = [...form.options];
                  arr[i] = e.target.value;
                  setForm({ ...form, options: arr });
                }} />
              </div>
            ))}
          </div>
          <label>
            <span className="label">Respuesta correcta (índice 0-3)</span>
            <input className="input" type="number" min={0} max={3} value={form.correct_index} onChange={(e) => setForm({ ...form, correct_index: Number(e.target.value) })} style={{ width: 160 }} />
          </label>
          <div className="row" style={{ gap: 12 }}>
            <button className="btn btn-primary" disabled={saving}>Crear</button>
            {saving && <span className="spinner" />}
          </div>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Importar CSV</h2>
        <p className="muted">Cabeceras esperadas: <code>idx,text,option_a,option_b,option_c,option_d,correct_index,time_limit_sec,points_base,points_time_factor</code></p>
        <div className="row" style={{ gap: 12, alignItems: 'center' }}>
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files && onCsvFile(e.target.files[0])} />
          <label className="row">
            <input type="checkbox" checked={replaceAll} onChange={(e) => setReplaceAll(e.target.checked)} />
            <span className="label">Reemplazar todas las preguntas</span>
          </label>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Listado</h2>
        <div className="list">
          {questions.map((q) => (
            <div key={q.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><strong>{q.idx}.</strong> {q.text}</div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-ghost" onClick={() => updateQuestion(q, { idx: q.idx + 1 })}>+idx</button>
                  <button className="btn btn-ghost" onClick={() => updateQuestion(q, { idx: Math.max(1, q.idx - 1) })}>-idx</button>
                  <button className="btn btn-danger" onClick={() => deleteQuestion(q)}>Eliminar</button>
                </div>
              </div>
              <div className="muted">Correcta: {String.fromCharCode(65 + q.correct_index)} · Tiempo: {q.time_limit_sec}s · Puntos: {q.points_base}+{q.points_time_factor}*t</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

