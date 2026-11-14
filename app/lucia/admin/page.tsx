'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import Wheel from '@/components/lucia/Wheel';
import {
  formatDate,
  prizeProbabilityTotal,
  round2,
  validateSegments,
  type LuciaSegment,
  type LuciaSettings,
} from '@/lib/lucia';

const KEY = 'lucia_admin_secret';
type Tab = 'ruleta' | 'jugadores' | 'canje' | 'qr';

interface Player {
  created_at: string;
  phone: string;
  email: string;
  won: boolean;
  prize_label: string | null;
  voucher_code: string | null;
  redeemed_at: string | null;
}

type Voucher = Omit<Player, 'won'>;

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export default function LuciaAdmin() {
  const [secret, setSecret] = useState<string | null>(null);
  const [pwd, setPwd] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [tab, setTab] = useState<Tab>('ruleta');

  useEffect(() => {
    try {
      setSecret(sessionStorage.getItem(KEY));
    } catch {
      /* noop */
    }
  }, []);

  const api = useCallback(
    async (path: string, init?: RequestInit, s = secret) => {
      const res = await fetch(path, {
        ...init,
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': s || '', ...(init?.headers || {}) },
        cache: 'no-store',
      });
      if (res.status === 401) {
        try {
          sessionStorage.removeItem(KEY);
        } catch {
          /* noop */
        }
        setSecret(null);
      }
      return res;
    },
    [secret],
  );

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr('');
    const res = await api('/api/lucia/admin/config', undefined, pwd);
    if (res.ok) {
      try {
        sessionStorage.setItem(KEY, pwd);
      } catch {
        /* noop */
      }
      setSecret(pwd);
    } else {
      const d = await res.json().catch(() => ({}));
      setLoginErr(d.error || 'No se pudo ingresar.');
    }
  }

  if (!secret) {
    return (
      <form className="la-login" onSubmit={login}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lucia/logo-negro.png" alt="Lucía Indumentaria" />
        <h3>Panel de la ruleta</h3>
        <input className="la-input" type="password" placeholder="Clave" value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus />
        <button className="la-btn" type="submit">Entrar</button>
        {loginErr && <p className="la-err">{loginErr}</p>}
      </form>
    );
  }

  return (
    <main className="la">
      <div className="la-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lucia/logo-negro.png" alt="Lucía Indumentaria" />
        <div className="la-tabs" role="tablist">
          {(
            [
              ['ruleta', 'Ruleta'],
              ['jugadores', 'Jugadores'],
              ['canje', 'Canjear'],
              ['qr', 'QR'],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button key={t} className="la-tab" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'ruleta' && <RuletaTab api={api} />}
      {tab === 'jugadores' && <PlayersTab api={api} />}
      {tab === 'canje' && <CanjeTab api={api} />}
      {tab === 'qr' && <QrTab />}
    </main>
  );
}

type Api = (_path: string, _init?: RequestInit) => Promise<Response>;

/* ------------------------------ Ruleta ------------------------------ */
function RuletaTab({ api }: { api: Api }) {
  const [segments, setSegments] = useState<LuciaSegment[] | null>(null);
  const [settings, setSettings] = useState<LuciaSettings | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/api/lucia/admin/config')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setSegments(d.segments);
        setSettings(d.settings);
      })
      .catch((e) => setMsg({ err: String(e.message || e) }));
  }, [api]);

  const errors = useMemo(() => (segments ? validateSegments(segments) : []), [segments]);

  if (!segments || !settings) return <p className="la-muted">{msg.err || 'Cargando…'}</p>;

  const total = round2(prizeProbabilityTotal(segments, true));
  const lose = round2(Math.max(0, 100 - total));

  const upd = (i: number, patch: Partial<LuciaSegment>) =>
    setSegments((prev) => prev!.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  async function save() {
    setSaving(true);
    setMsg({});
    try {
      const res = await api('/api/lucia/admin/config', { method: 'PUT', body: JSON.stringify({ segments, settings }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'No se pudo guardar');
      setMsg({ ok: 'Guardado. Los cambios ya rigen para el próximo tiro.' });
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="la-grid">
      <div className="la-card">
        <h2>Gajos</h2>
        <p className="la-muted" style={{ marginTop: -6 }}>
          El gajo 1 es el de arriba y siguen en sentido horario. En los premios reales, el % es la chance de salir en cada tiro. El stock vacío
          significa ilimitado; cuando llega a 0, ese premio deja de salir.
        </p>
        <div className="la-segs">
          {segments.map((s, i) => (
            <div className="la-seg" key={s.position}>
              <span className="la-seg-n">{s.position + 1}</span>
              <input
                className="la-seg-color"
                type="color"
                value={s.color}
                onChange={(e) => upd(i, { color: e.target.value.toUpperCase() })}
                aria-label={`Color del gajo ${s.position + 1}`}
              />
              <div className="la-seg-fields">
                <input
                  className="la-input"
                  name="label"
                  value={s.label}
                  maxLength={40}
                  onChange={(e) => upd(i, { label: e.target.value })}
                  aria-label={`Nombre del gajo ${s.position + 1}`}
                />
                <select
                  className="la-input"
                  value={s.kind}
                  onChange={(e) => {
                    const kind = e.target.value as LuciaSegment['kind'];
                    upd(i, kind === 'lose' ? { kind, probability: 0, stock: null } : { kind });
                  }}
                >
                  <option value="prize">Premio real</option>
                  <option value="lose">Suerte la próxima</option>
                </select>
                {s.kind === 'prize' && (
                  <>
                    <label className="la-mini">
                      <input
                        className="la-input la-input--num"
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={s.probability}
                        onChange={(e) => upd(i, { probability: e.target.value === '' ? 0 : Number(e.target.value) })}
                      />
                      %
                    </label>
                    <label className="la-mini">
                      Stock
                      <input
                        className="la-input la-input--num"
                        type="number"
                        min={0}
                        step={1}
                        placeholder="∞"
                        value={s.stock ?? ''}
                        onChange={(e) => upd(i, { stock: e.target.value === '' ? null : Math.floor(Number(e.target.value)) })}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Chance por tiro</h3>
          <div className="la-bar" aria-hidden>
            <i style={{ width: `${Math.min(total, 100)}%`, background: '#111' }} />
            <i style={{ width: `${lose}%`, background: '#B2AC82' }} />
          </div>
          <p className="la-muted">
            Gana algún premio: <b>{total}%</b> · Suerte la próxima: <b>{lose}%</b>
            {total !== round2(prizeProbabilityTotal(segments)) && ' (los premios sin stock no suman)'}
          </p>
        </div>

        <h2 style={{ marginTop: 22 }}>Voucher y promo</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <label className="la-row">
            <input type="checkbox" checked={settings.active} onChange={(e) => setSettings({ ...settings, active: e.target.checked })} />
            <span>Ruleta activa (si la apagás, el QR muestra “en pausa”)</span>
          </label>
          <label>
            <h3>Frase del voucher</h3>
            <input className="la-input" value={settings.voucher_phrase} maxLength={80} onChange={(e) => setSettings({ ...settings, voucher_phrase: e.target.value })} />
          </label>
          <label>
            <h3>Válido hasta</h3>
            <input className="la-input" type="date" value={settings.valid_until} onChange={(e) => setSettings({ ...settings, valid_until: e.target.value })} />
          </label>
          <label>
            <h3>Texto legal</h3>
            <textarea className="la-input" rows={2} maxLength={240} value={settings.legal_text} onChange={(e) => setSettings({ ...settings, legal_text: e.target.value })} />
          </label>
        </div>

        {errors.length > 0 && (
          <ul className="la-err">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <div className="la-row" style={{ marginTop: 16 }}>
          <button className="la-btn" onClick={save} disabled={saving || errors.length > 0}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {msg.ok && <span className="la-ok">{msg.ok}</span>}
          {msg.err && <span className="la-err">{msg.err}</span>}
        </div>
      </div>

      <div className="la-card la-preview">
        <h3>Vista previa</h3>
        <Wheel segments={segments} rotation={0} durationMs={0} />
        <p className="la-muted">Válido hasta el {formatDate(settings.valid_until)}</p>
      </div>
    </div>
  );
}

/* ---------------------------- Jugadores ---------------------------- */
function PlayersTab({ api }: { api: Api }) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api('/api/lucia/admin/players')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setPlayers(d.players);
      })
      .catch((e) => setErr(String(e.message || e)));
  }, [api]);
  useEffect(load, [load]);

  async function exportCsv() {
    const res = await api('/api/lucia/admin/players?format=csv');
    if (!res.ok) return setErr('No se pudo exportar.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucia-jugadores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!players) return <p className="la-muted">{err || 'Cargando…'}</p>;

  const winners = players.filter((p) => p.won);
  const redeemed = winners.filter((p) => p.redeemed_at);
  const byPrize = winners.reduce<Record<string, number>>((acc, p) => {
    const k = p.prize_label || '—';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const term = q.trim().toLowerCase();
  const list = term
    ? players.filter((p) => [p.phone, p.email, p.voucher_code, p.prize_label].some((v) => v?.toLowerCase().includes(term)))
    : players;

  return (
    <div className="la-card">
      <div className="la-sum">
        <div className="la-stat"><b>{players.length}</b><span>Jugadores</span></div>
        <div className="la-stat"><b>{winners.length}</b><span>Ganadores</span></div>
        <div className="la-stat"><b>{redeemed.length}</b><span>Canjeados</span></div>
        {Object.entries(byPrize).map(([k, v]) => (
          <div className="la-stat" key={k}><b>{v}</b><span>{k}</span></div>
        ))}
      </div>
      <div className="la-row" style={{ marginBottom: 12 }}>
        <input className="la-input" style={{ flex: '1 1 220px', width: 'auto' }} placeholder="Buscar teléfono, mail o código" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="la-btn la-btn--ghost" onClick={load}>Actualizar</button>
        <button className="la-btn" onClick={exportCsv}>Exportar CSV</button>
      </div>
      {err && <p className="la-err">{err}</p>}
      <div className="la-table-wrap">
        <table className="la-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Teléfono</th>
              <th>Mail</th>
              <th>Resultado</th>
              <th>Código</th>
              <th>Canje</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.phone}>
                <td>{fmtDateTime(p.created_at)}</td>
                <td>{p.phone}</td>
                <td>{p.email}</td>
                <td>{p.won ? <span className="la-tag la-tag--win">{p.prize_label}</span> : <span className="la-muted">Suerte la próxima</span>}</td>
                <td className="la-code">{p.voucher_code || '—'}</td>
                <td>{p.won ? (p.redeemed_at ? fmtDateTime(p.redeemed_at) : <span className="la-muted">Pendiente</span>) : ''}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="la-muted">Sin resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Canje ------------------------------ */
function CanjeTab({ api }: { api: Api }) {
  const [code, setCode] = useState('');
  const [v, setV] = useState<Voucher | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    setErr('');
    setV(null);
    let c = code.trim().toUpperCase();
    if (c && !c.startsWith('LU-')) c = `LU-${c}`;
    const res = await api(`/api/lucia/admin/voucher?code=${encodeURIComponent(c)}`);
    const d = await res.json();
    if (!res.ok) return setErr(d.error || 'Error');
    setV(d.voucher);
  }

  async function mark(redeemed: boolean) {
    if (!v?.voucher_code) return;
    setBusy(true);
    const res = await api('/api/lucia/admin/voucher', { method: 'POST', body: JSON.stringify({ code: v.voucher_code, redeemed }) });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(d.error || 'Error');
    setV(d.voucher);
  }

  return (
    <div className="la-card" style={{ maxWidth: 560 }}>
      <h2>Canjear voucher</h2>
      <form className="la-row" onSubmit={lookup}>
        <input
          className="la-input la-code"
          style={{ flex: '1 1 200px', width: 'auto', fontSize: 20 }}
          placeholder="LU-XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoCapitalize="characters"
        />
        <button className="la-btn" type="submit">Buscar</button>
      </form>
      {err && <p className="la-err">{err}</p>}
      {v && (
        <div style={{ marginTop: 16, display: 'grid', gap: 6 }}>
          <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 28 }}>{v.prize_label}</p>
          <p className="la-muted" style={{ margin: 0 }}>
            {v.phone} · {v.email} · emitido {fmtDateTime(v.created_at)}
          </p>
          {v.redeemed_at ? (
            <>
              <p className="la-err" style={{ margin: '8px 0' }}>Ya fue canjeado el {fmtDateTime(v.redeemed_at)}.</p>
              <button className="la-btn la-btn--ghost" onClick={() => mark(false)} disabled={busy}>Deshacer canje</button>
            </>
          ) : (
            <>
              <p className="la-ok" style={{ margin: '8px 0' }}>Válido, sin canjear.</p>
              <button className="la-btn" onClick={() => mark(true)} disabled={busy}>Marcar como canjeado</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- QR -------------------------------- */
function QrTab() {
  const [url, setUrl] = useState('');
  const [png, setPng] = useState('');

  useEffect(() => {
    setUrl(`${window.location.origin}/lucia`);
  }, []);
  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 1200, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#FFFFFF' } })
      .then(setPng)
      .catch(() => setPng(''));
  }, [url]);

  return (
    <div className="la-card la-qr">
      <h2>QR para imprimir</h2>
      <input className="la-input" value={url} onChange={(e) => setUrl(e.target.value)} style={{ maxWidth: 420 }} />
      <p className="la-muted" style={{ margin: 0 }}>Si cambiás de dominio, editá la URL de arriba antes de descargar.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {png && <img src={png} alt={`QR a ${url}`} />}
      {png && (
        <a className="la-btn" href={png} download="lucia-ruleta-qr.png" style={{ textDecoration: 'none' }}>
          Descargar QR (PNG)
        </a>
      )}
    </div>
  );
}
