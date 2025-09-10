"use client";
import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Tenant = { id: string; name: string; slug: string; contact_email: string | null; active: boolean };

export default function AdminHome() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isSuper, setIsSuper] = useState<boolean | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', email: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(!!data.session);
      setSessionReady(true);
      if (data.session) {
        const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).maybeSingle();
        setIsSuper(prof?.role === 'super_admin');
      }
    })();
  }, [supabase]);

  useEffect(() => {
    if (!signedIn || !isSuper) return;
    (async () => {
      const { data } = await supabase.from('tenants').select('id,name,slug,contact_email,active').order('created_at', { ascending: false });
      setTenants((data as any) || []);
    })();
  }, [signedIn, isSuper, supabase]);

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { error } = await supabase.from('tenants').insert({ name: form.name, slug: form.slug, contact_email: form.email, active: true });
      if (error) throw error;
      setForm({ name: '', slug: '', email: '' });
      const { data } = await supabase.from('tenants').select('id,name,slug,contact_email,active').order('created_at', { ascending: false });
      setTenants((data as any) || []);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggleActive(t: Tenant) {
    const { error } = await supabase.from('tenants').update({ active: !t.active }).eq('id', t.id);
    if (!error) setTenants((prev) => prev.map((x) => (x.id === t.id ? { ...x, active: !x.active } : x)));
  }

  if (!sessionReady) return <main className="container"><p className="muted">Verificando sesión…</p></main>;
  if (!signedIn) return <main className="container"><p><a className="btn btn-primary" href="/login">Ingresar</a></p></main>;
  if (isSuper === false) return <main className="container"><p>No tenés permisos de super admin.</p><p className="muted">Promové tu usuario en `profiles` a `super_admin` desde SQL.</p></main>;

  return (
    <main className="container">
      <h1 className="heading">Super Admin</h1>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Tenants</h2>
        <form onSubmit={createTenant} className="row" style={{ gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <span className="label">Nombre</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <span className="label">Slug</span>
            <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} pattern="[a-z0-9-]+" required />
          </div>
          <div>
            <span className="label">Email contacto</span>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <button className="btn btn-primary">Crear</button>
          {error && <small style={{ color: 'tomato' }}>{error}</small>}
        </form>
        <div className="list" style={{ marginTop: 16 }}>
          {tenants.map((t) => (
            <div key={t.id} className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{t.name}</strong> <span className="muted">({t.slug})</span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <a className="btn" href={`/admin/tenants/${t.slug}`}>Abrir</a>
                <button className="btn btn-ghost" onClick={() => toggleActive(t)}>{t.active ? 'Desactivar' : 'Activar'}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

