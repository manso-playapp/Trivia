'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Wheel from '@/components/lucia/Wheel';
import { formatDate, normalizeEmail, normalizePhone, targetRotation, type PublicSegment, type SpinResult } from '@/lib/lucia';
import { canvasToBlob, renderVoucher } from '@/lib/luciaVoucher';

const STORAGE_KEY = 'lucia_ruleta_resultado_v1';

type Phase = 'loading' | 'form' | 'spinning' | 'result' | 'inactive' | 'error';

const PLACEHOLDER: PublicSegment[] = Array.from({ length: 8 }, (_, i) => ({
  position: i,
  label: '',
  color: ['#111111', '#B2AC82', '#F1EDE0', '#8C8762'][i % 4],
}));

function readSaved(): SpinResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SpinResult) : null;
  } catch {
    return null;
  }
}

export default function LuciaRuleta() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [segments, setSegments] = useState<PublicSegment[]>(PLACEHOLDER);
  const [legal, setLegal] = useState('No acumulable con otras promociones. Válido hasta el 31/12/2026.');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<{ msg: string; field?: 'phone' | 'email' } | null>(null);
  const [sending, setSending] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(5600);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null);
  const [voucherBlob, setVoucherBlob] = useState<Blob | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
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
    renderVoucher({
      prize: result.label,
      code: result.code,
      phrase: result.phrase,
      legal: result.legal,
      validUntil: result.valid_until,
    })
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!normalizePhone(phone)) return setError({ msg: 'Revisá el teléfono (con código de área).', field: 'phone' });
    if (!normalizeEmail(email)) return setError({ msg: 'Revisá el mail.', field: 'email' });
    if (!accept) return setError({ msg: 'Para jugar tenés que aceptar las bases y condiciones.' });

    setSending(true);
    try {
      const res = await fetch('/api/lucia/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email, accept }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ msg: data.error || 'No pudimos procesar tu jugada. Probá de nuevo.', field: data.field });
        return;
      }
      const r = data as SpinResult;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
      } catch {
        /* sin storage: igual sigue */
      }
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const d = reduce ? 1200 : 5600;
      setDuration(d);
      setResult(r);
      setPhase('spinning');
      wheelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Pequeña pausa para que el scroll arranque antes del giro
      window.setTimeout(() => {
        setRotation((cur) => targetRotation(cur, r.position, segments.length, Math.random()));
        endTimer.current = window.setTimeout(finishSpin, d + 400);
      }, 250);
    } catch {
      setError({ msg: 'Sin conexión. Revisá internet y probá de nuevo.' });
    } finally {
      setSending(false);
    }
  }

  async function download() {
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

  return (
    <main className="lp">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={phase === 'result' ? 'lp-logo lp-logo--sm' : 'lp-logo'} src="/lucia/logo-negro.png" alt="Lucía Indumentaria" />

      {phase === 'loading' && <p className="lp-loading">Cargando…</p>}

      {phase === 'error' && (
        <>
          <p className="lp-sub">No pudimos cargar el juego. Revisá tu conexión.</p>
          <button className="lp-btn" onClick={() => location.reload()}>Reintentar</button>
        </>
      )}

      {phase === 'inactive' && (
        <>
          <h1 className="lp-title">La ruleta <em>está en pausa</em></h1>
          <p className="lp-sub">Volvé a escanear el QR más tarde. ¡Gracias!</p>
        </>
      )}

      {(phase === 'form' || phase === 'spinning') && (
        <>
          <p className="lp-kicker">Girá y ganá</p>
          <h1 className="lp-title">
            Tu próxima compra <em>tiene premio</em>
          </h1>
          <div ref={wheelRef}>
            <Wheel segments={segments} rotation={rotation} durationMs={duration} onSpinEnd={finishSpin} />
          </div>

          {phase === 'form' && (
            <form className="lp-form" onSubmit={onSubmit} noValidate>
              <div className="lp-field">
                <label htmlFor="tel">Teléfono</label>
                <input
                  id="tel"
                  className="lp-input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Ej: 351 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={error?.field === 'phone'}
                  required
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
                  required
                />
              </div>
              <label className="lp-check">
                <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                <span>Acepto las bases y condiciones y que Lucía Indumentaria me contacte con novedades.</span>
              </label>
              {error && <p className="lp-error" role="alert">{error.msg}</p>}
              <button className="lp-btn" type="submit" disabled={sending}>
                {sending ? 'Un momento…' : 'Jugar'}
              </button>
              <p className="lp-legal">Una jugada por persona. {legal}</p>
            </form>
          )}
          {phase === 'spinning' && <p className="lp-kicker">¡Suerte!</p>}
        </>
      )}

      {phase === 'result' && result && (
        <section className="lp-result" aria-live="polite">
          {result.won ? (
            <>
              <p className="lp-kicker">¡Ganaste!</p>
              <h1 className="lp-title">{result.label}</h1>
              {voucherUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="lp-voucher" src={voucherUrl} alt={`Voucher ${result.label}, código ${result.code}`} />
              ) : (
                <p className="lp-loading">Generando tu voucher…</p>
              )}
              <div className="lp-actions">
                <button className="lp-btn" onClick={download} disabled={!voucherUrl}>
                  Descargar voucher
                </button>
                {canShare && (
                  <button className="lp-btn lp-btn--ghost" onClick={share}>
                    Guardar / compartir
                  </button>
                )}
              </div>
              <p className="lp-hint">
                Si no se descarga, mantené presionada la imagen y elegí “Guardar imagen”. Código: <b>{result.code}</b>
              </p>
              <p className="lp-legal">{result.legal || `Válido hasta el ${formatDate(result.valid_until)}.`}</p>
            </>
          ) : (
            <>
              <p className="lp-kicker">Esta vez no fue</p>
              <h1 className="lp-title">
                Suerte <em>la próxima</em>
              </h1>
              <p className="lp-sub">Gracias por participar. Te esperamos en Lucía Indumentaria.</p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
