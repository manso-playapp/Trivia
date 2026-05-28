"use client";
import { useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: (process.env.NEXT_PUBLIC_BASE_URL || window.location.origin) + '/t/demo/host/demo-game' } });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: 480 }}>
      <h1>Ingreso</h1>
      {!sent ? (
        <form onSubmit={onSubmit} className="card">
          <div className="stack">
            <div>
              <span className="label">Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando…' : 'Recibir magic link'}
            </button>
            {error && <small style={{ color: 'tomato' }}>{error}</small>}
            <small className="muted">Recibirás un enlace para iniciar sesión.</small>
          </div>
        </form>
      ) : (
        <p>Revisá tu bandeja de entrada y abrí el enlace de acceso.</p>
      )}
    </main>
  );
}

