"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Game = { id: string; slug: string; name: string; status: string; theme_id: string | null };

export default function TenantAdmin({ params }: { params: { tenant: string } }) {
  const { tenant } = params;
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [games, setGames] = useState<Game[]>([]);
  const [themes, setThemes] = useState<{ id: string; name: string }[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '' });

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from('tenants').select('id, name').eq('slug', tenant).maybeSingle();
      if (!t) return;
      setTenantId(t.id);
      const { data: gs } = await supabase.from('games').select('id,slug,name,status,theme_id').eq('tenant_id', t.id).order('created_at', { ascending: false });
      setGames((gs as any) || []);
      const { data: th } = await supabase.from('themes').select('id,name').eq('tenant_id', t.id);
      setThemes((th as any) || []);
    })();
  }, [tenant, supabase]);

  async function createGame(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    const { error } = await supabase.from('games').insert({ tenant_id: tenantId, name: form.name, slug: form.slug, status: 'draft' });
    if (!error) {
      setForm({ name: '', slug: '' });
      const { data: gs } = await supabase.from('games').select('id,slug,name,status,theme_id').eq('tenant_id', tenantId).order('created_at', { ascending: false });
      setGames((gs as any) || []);
    }
  }

  async function updateGame(g: Game, patch: Partial<Game>) {
    const { error } = await supabase.from('games').update(patch).eq('id', g.id);
    if (!error) setGames((prev) => prev.map((x) => (x.id === g.id ? { ...x, ...patch } : x)));
  }

  return (
    <main className="container">
      <h1 className="heading">Tenant: {tenant}</h1>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Juegos</h2>
        <form onSubmit={createGame} className="row" style={{ gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <span className="label">Nombre</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <span className="label">Slug</span>
            <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} pattern="[a-z0-9-]+" required />
          </div>
          <button className="btn btn-primary">Crear</button>
        </form>

        <div className="list" style={{ marginTop: 16 }}>
          {games.map((g) => (
            <div key={g.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><strong>{g.name}</strong> <span className="muted">({g.slug})</span></div>
                <div className="row" style={{ gap: 8 }}>
                  <a className="btn" href={`/display/${tenant}/${g.slug}`}>Display</a>
                  <a className="btn" href={`/play/${tenant}/${g.slug}`}>Play</a>
                  <a className="btn" href={`/t/${tenant}/host/${g.slug}`}>Host</a>
                </div>
              </div>
              <div className="row" style={{ gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                <label className="row">
                  <span className="label">Estado</span>
                  <select className="input" style={{ width: 180 }} value={g.status} onChange={(e) => updateGame(g, { status: e.target.value })}>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="archived">archived</option>
                  </select>
                </label>
                <label className="row">
                  <span className="label">Tema</span>
                  <select className="input" style={{ width: 240 }} value={g.theme_id || ''} onChange={(e) => updateGame(g, { theme_id: e.target.value || null } as any)}>
                    <option value="">(sin tema)</option>
                    {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

