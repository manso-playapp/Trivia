'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Wheel from '@/components/lucia/Wheel';
import {
  DEFAULT_SEGMENT_COLORS,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  normalizeEmail,
  normalizePhone,
  targetRotation,
  type PublicSegment,
  type SpinResult,
} from '@/lib/lucia';
import { canvasToBlob, renderVoucher } from '@/lib/luciaVoucher';

const STORAGE_KEY = 'lucia_ruleta_resultado_v1';

type Phase = 'loading' | 'form' | 'game' | 'spinning' | 'result' | 'inactive' | 'error';

const PLACEHOLDER: PublicSegment[] = Array.from({ length: 8 }, (_, i) => ({
  position: i,
  label: '',
  color: DEFAULT_SEGMENT_COLORS[i % DEFAULT_SEGMENT_COLORS.length],
}));

function readSaved(): SpinResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SpinResult) : null;
  } catch {
    return null;
  }
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Pide pantalla completa (Android / escritorio). En iPhone Safari no existe: se ignora. */
function enterFullscreen() {
  try {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (document.fullscreenElement) return;
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => undefined);
    else el.webkitRequestFullscreen?.();
  } catch {
    /* sin soporte */
  }
}

export default function LuciaRuleta() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [segments, setSegments] = useState<PublicSegment[]>(PLACEHOLDER);
  const [legal, setLegal] = useState('No acumulable con otras promociones. Válido hasta el 31/12/2026.');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [follow, setFollow] = useState(false);
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<{ msg: string; field?: 'phone' | 'email' } | null>(null);
  const [sending, setSending] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(5600);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null);
  const [voucherBlob, setVoucherBlob] = useState<Blob | null>(null);
  const endTimer = useRef<number | null>(null);

  useEffect(() => {
    const saved = readSaved();
    fetch('/api/lucia/config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg.error) throw new Error(cfg.error);
        if (Array.isArray(cfg.segments) && cfg.segments.length) setSegments(cfg.segments);
        if (cfg.legal) setLegal(cfg.legal);
        if (saved) {
          setResult(saved);
          setPhase('result');
        } else setPhase(cfg.active ? 'form' : 'inactive');
      })
      .catch(() => {
        if (saved) {
          setResult(saved);
          setPhase('result');
        } else setPhase('error');
      });
  }, []);

  // Genera el voucher cuando hay un premio
  useEffect(() => {
    if (phase !== 'result' || !result?.won || !result.code) return;
    let url: string | null = null;
    let cancelled = false;
    renderVoucher({ prize: result.label, code: result.code, phrase: result.phrase, legal: result.legal, validUntil: result.valid_until })
      .then(canvasToBlob)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setVoucherBlob(blob);
        setVoucherUrl(url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [phase, result]);

  const finishSpin = useCallback(() => {
    if (endTimer.current) window.clearTimeout(endTimer.current);
    endTimer.current = null;
    setPhase((p) => (p === 'spinning' ? 'result' : p));
  }, []);

  /** Paso 1: validar datos y entrar al juego */
  async function onEnter(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!normalizePhone(phone)) return setError({ msg: 'Revisá el teléfono (con código de área).', field: 'phone' });
    if (!normalizeEmail(email)) return setError({ msg: 'Revisá el mail.', field: 'email' });
    if (!follow) return setError({ msg: `Para jugar, seguinos en Instagram ${INSTAGRAM_HANDLE} y marcá la casilla.` });
    if (!accept) return setError({ msg: 'Para jugar tenés que aceptar las bases y condiciones.' });

    enterFullscreen();
    setSending(true);
    try {
      const res = await fetch('/api/lucia/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email }),
      });
      const data = await res.json();
      if (!res.ok) return setError({ msg: data.error || 'No pudimos validar tus datos.', field: data.field });
      setPhase('game');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError({ msg: 'Sin conexión. Revisá internet y probá de nuevo.' });
    } finally {
      setSending(false);
    }
  }

  /** Paso 2: girar (el resultado lo decide el servidor) */
  async function onSpin() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch('/api/lucia/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email, accept: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ msg: data.error || 'No pudimos procesar tu jugada. Probá de nuevo.' });
        return;
      }
      const r = data as SpinResult;
      try {
        // Los mails de prueba no guardan el resultado: pueden volver a jugar.
        if (!r.test) localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
      } catch {
        /* sin storage: igual sigue */
      }
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const d = reduce ? 1200 : 5600;
      setDuration(d);
      setResult(r);
      setPhase('spinning');
      setRotation((cur) => targetRotation(cur, r.position, segments.length, Math.random()));
      endTimer.current = window.setTimeout(finishSpin, d + 400);
    } catch {
      setError({ msg: 'Sin conexión. Revisá internet y probá de nuevo.' });
    } finally {
      setSending(false);
    }
  }

  function download() {
    if (!voucherUrl || !result?.code) return;
    const a = document.createElement('a');
    a.href = voucherUrl;
    a.download = `voucher-lucia-${result.code}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function share() {
    if (!voucherBlob || !result?.code) return;
    const file = new File([voucherBlob], `voucher-lucia-${result.code}.png`, { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: 'Mi voucher Lucía' });
    } catch {
      /* cancelado */
    }
  }

  const canShare =
    typeof navigator !== 'undefined' &&
    !!voucherBlob &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([voucherBlob], 'v.png', { type: 'image/png' })] });

  const inGame = phase === 'game' || phase === 'spinning';

  return (
    <main className={`lp ${inGame ? 'lp--game' : ''}`}>
      <div className="lp-bg" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={inGame || phase === 'result' ? 'lp-logo lp-logo--sm' : 'lp-logo'} src="/lucia/logo-crema.png" alt="Lucía Indumentaria" />

      {phase === 'loading' && <p className="lp-kicker">Cargando…</p>}

      {phase === 'error' && (
        <div className="lp-card">
          <p className="lp-text">No pudimos cargar el juego. Revisá tu conexión.</p>
          <button className="lp-btn" onClick={() => location.reload()}>Reintentar</button>
        </div>
      )}

      {phase === 'inactive' && (
        <div className="lp-card">
          <h1 className="lp-title">La ruleta está en pausa</h1>
          <p className="lp-text">Volvé a escanear el QR más tarde. ¡Gracias!</p>
        </div>
      )}

      {phase === 'form' && (
        <form className="lp-card" onSubmit={onEnter} noValidate>
          <p className="lp-kicker">Girá y ganá</p>
          <p className="lp-text">Dejanos tus datos para participar.</p>
          <div className="lp-field">
            <label htmlFor="tel">Teléfono</label>
            <input
              id="tel"
              className="lp-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Ej: 342 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={error?.field === 'phone'}
            />
          </div>
          <div className="lp-field">
            <label htmlFor="mail">Mail</label>
            <input
              id="mail"
              className="lp-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error?.field === 'email'}
            />
          </div>

          <div className="lp-checks">
            <a className="lp-ig-link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={() => setFollow(true)}>
              <InstagramIcon />
              <span>Seguinos en {INSTAGRAM_HANDLE}</span>
            </a>
            <label className="lp-check">
              <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
              <span>Ya sigo a Lucía en Instagram</span>
            </label>
            <label className="lp-check">
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
              <span>Acepto las bases y condiciones y recibir novedades de Lucía Indumentaria.</span>
            </label>
          </div>

          {error && <p className="lp-error" role="alert">{error.msg}</p>}
          <button className="lp-btn" type="submit" disabled={sending}>
            {sending ? 'Un momento…' : 'Ingresar al juego'}
          </button>
          <p className="lp-legal">Una jugada por persona. {legal}</p>
        </form>
      )}

      {inGame && (
        <section className="lp-game">
          <Wheel segments={segments} rotation={rotation} durationMs={duration} onSpinEnd={finishSpin} />
          {error && <p className="lp-error" role="alert">{error.msg}</p>}
          <button className="lp-btn lp-btn--spin" onClick={onSpin} disabled={sending || phase === 'spinning'}>
            {phase === 'spinning' ? 'Girando…' : sending ? 'Un momento…' : 'Girar'}
          </button>
        </section>
      )}

      {phase === 'result' && result && (
        <section className="lp-card lp-result" aria-live="polite">
          {result.test && <p className="lp-testtag">Modo prueba · no cuenta</p>}
          {result.won ? (
            <>
              <p className="lp-kicker">¡Ganaste!</p>
              <h1 className="lp-title">{result.label}</h1>
              {voucherUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="lp-voucher" src={voucherUrl} alt={`Voucher ${result.label}, código ${result.code}`} />
              ) : (
                <p className="lp-text">Generando tu voucher…</p>
              )}
              <button className="lp-btn" onClick={download} disabled={!voucherUrl}>
                Descargar voucher
              </button>
              {canShare && (
                <button className="lp-btn lp-btn--ghost" onClick={share}>
                  Guardar / compartir
                </button>
              )}
              <p className="lp-legal">
                Si no se descarga, mantené presionada la imagen y elegí “Guardar imagen”. Tu código: <b>{result.code}</b>
              </p>
            </>
          ) : (
            <>
              <p className="lp-kicker">Esta vez no fue</p>
              <h1 className="lp-title">Suerte la próxima</h1>
              <p className="lp-text">Gracias por participar. Te esperamos en Lucía Indumentaria.</p>
              <a className="lp-btn lp-btn--ghost" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                Ver novedades en Instagram
              </a>
            </>
          )}
          {result.test && (
            <button className="lp-btn lp-btn--ghost" onClick={() => location.reload()}>
              Jugar otra vez (prueba)
            </button>
          )}
        </section>
      )}
    </main>
  );
}
