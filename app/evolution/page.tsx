import { computeProgress, evolution } from '@/data/evolution';

function StatusPill({ s }: { s: 'done' | 'in_progress' | 'planned' }) {
  const map: Record<string, { text: string; color: string }> = {
    done: { text: 'Completo', color: '#22c55e' },
    in_progress: { text: 'En curso', color: '#f59e0b' },
    planned: { text: 'Pendiente', color: '#94a3b8' },
  };
  const it = map[s];
  return (
    <span className="tag" style={{ background: 'transparent', border: '1px solid #1f2937', color: it.color }}>
      {it.text}
    </span>
  );
}

export default function EvolutionPage() {
  const p = computeProgress(evolution);
  return (
    <main className="container">
      <h1 className="heading">Evolución del Proyecto</h1>
      <p className="muted">Seguimiento de funcionalidades, estado y cobertura actual.</p>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>Progreso total:</strong> {p.pct}% ({p.done}/{p.total} completos)
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="tag">En curso: {p.inProg}</span>
            <span className="tag">Pendientes: {p.planned}</span>
          </div>
        </div>
        <div style={{ height: 10, background: '#111827', borderRadius: 999, marginTop: 10 }}>
          <div style={{ width: `${p.pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 999 }} />
        </div>
      </section>

      <div className="stack" style={{ marginTop: 20 }}>
        {evolution.map((sec) => (
          <section className="card" key={sec.name}>
            <h2 style={{ marginTop: 0 }}>{sec.name}</h2>
            <div className="list">
              {sec.items.map((it) => (
                <div key={it.title} className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div><strong>{it.title}</strong>{it.link ? <> · <a href={it.link}>ver</a></> : null}</div>
                    {it.desc ? <small className="muted">{it.desc}</small> : null}
                  </div>
                  <StatusPill s={it.status} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

