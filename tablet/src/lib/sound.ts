// Sonidos PROPIOS, generados por el juego: no hay archivos de audio de terceros, no se
// necesita internet y no hay licencias. Dos caminos para que suene en cualquier equipo:
//  1) Web Audio (el normal).
//  2) Respaldo: el mismo sonido convertido en un archivo WAV en memoria y reproducido con
//     un <audio> común (sirve cuando Web Audio queda bloqueado, por ejemplo en iPhone).
// Los navegadores solo dejan sonar después de un toque: en CUALQUIER toque se intenta
// desbloquear el audio, reintentando hasta que quede activo.
// En Android además manda el volumen "multimedia" del equipo: en 0, no suena nada.

export type AudioState = 'running' | 'blocked' | 'unsupported';

/** Una nota: frecuencia (Hz), comienzo y duración (s), volumen (0-1) y frecuencia final opcional. */
type Note = [freq: number, start: number, dur: number, vol: number, endFreq?: number];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.7;
let musicTimer: number | null = null;
let lastError = '';
let htmlUnlocked = false;
const listeners = new Set<(s: AudioState) => void>();

// ---------- Definición de los sonidos ----------

const chirp = (t: number, p = 1): Note[] => [
  [2400 * p, t, 0.07, 0.07, 3400 * p],
  [3300 * p, t + 0.07, 0.08, 0.06, 2500 * p],
];
const bell = (f: number, t: number, v = 0.12): Note[] => [
  [f, t, 0.6, v],
  [f * 2.76, t, 0.35, v * 0.25],
];

const SOUNDS = {
  tap: [[880, 0, 0.06, 0.06]] as Note[],
  count: [[1046, 0, 0.09, 0.09]] as Note[],
  go: [[784, 0, 0.12, 0.1], [1175, 0.1, 0.22, 0.1], ...chirp(0.25)] as Note[],
  tick: [[1500, 0, 0.03, 0.025]] as Note[],
  correct: [...bell(1318, 0), ...bell(1760, 0.09, 0.1), ...chirp(0.3)] as Note[],
  wrong: [[523, 0, 0.22, 0.07], [440, 0.16, 0.32, 0.06]] as Note[],
  celebrate: [
    ...[784, 988, 1175, 1568].flatMap((f, i) => bell(f, i * 0.11, 0.09)),
    ...[0.55, 0.75, 0.9, 1.1, 1.3].flatMap((t, i) => chirp(t, 0.92 + (i % 3) * 0.06)),
  ] as Note[],
};
type SoundName = keyof typeof SOUNDS;

// Niveles pensados para el parlante de una tablet en un stand con ruido.
const LEVEL = 2.5;

// ---------- Estado ----------

function supported(): boolean {
  return typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
}

export function audioState(): AudioState {
  if (!supported()) return 'unsupported';
  return (ctx && ctx.state === 'running') || htmlUnlocked ? 'running' : 'blocked';
}

/** Detalle técnico para el menú del operador. */
export function audioDetails(): string {
  const web = ctx ? ctx.state : 'sin iniciar';
  return `Web Audio: ${web} · respaldo <audio>: ${htmlUnlocked ? 'habilitado' : 'no habilitado'}${lastError ? ` · último error: ${lastError}` : ''}`;
}

function notify() {
  const s = audioState();
  listeners.forEach((fn) => fn(s));
}

export function onAudioState(fn: (s: AudioState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? volume : 0;
    master.connect(ctx.destination);
    ctx.onstatechange = notify;
    return ctx;
  } catch (e) {
    lastError = String((e as Error)?.message ?? e);
    return null;
  }
}

// ---------- Respaldo: WAV en memoria ----------

const RATE = 22050;
const wavCache = new Map<string, string>();

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Convierte notas en un WAV mono de 16 bits (data: URI, sin red ni archivos). */
function renderWav(notes: Note[]): string {
  const total = notes.length ? Math.max(...notes.map((n) => n[1] + n[2])) + 0.05 : 0.05;
  const len = Math.ceil(total * RATE);
  const pcm = new Float32Array(len);
  for (const [f, start, dur, vol, end] of notes) {
    const s0 = Math.floor(start * RATE);
    const n = Math.floor(dur * RATE);
    let phase = 0;
    for (let i = 0; i < n && s0 + i < len; i++) {
      const t = i / RATE;
      const freq = end ? f * Math.pow(end / f, t / dur) : f;
      phase += (2 * Math.PI * freq) / RATE;
      const attack = Math.min(1, t / 0.015);
      const decay = Math.exp((-5 * t) / dur);
      pcm[s0 + i] += Math.sin(phase) * vol * LEVEL * attack * decay;
    }
  }
  const bytes = new Uint8Array(44 + len * 2);
  const v = new DataView(bytes.buffer);
  const w = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true); v.setUint32(28, RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);
  return `data:audio/wav;base64,${toBase64(bytes)}`;
}

function wavFor(name: string, notes: Note[]): string {
  let url = wavCache.get(name);
  if (!url) {
    url = renderWav(notes);
    wavCache.set(name, url);
  }
  return url;
}

function playHtml(name: string, notes: Note[], vol = volume) {
  try {
    const el = new Audio(wavFor(name, notes));
    el.setAttribute('playsinline', '');
    el.volume = Math.max(0, Math.min(1, vol));
    void el.play().catch((e) => {
      lastError = String(e?.name ?? e);
      notify();
    });
  } catch (e) {
    lastError = String((e as Error)?.message ?? e);
  }
}

// ---------- Desbloqueo ----------

/** Se llama dentro de un toque. Devuelve true si el audio quedó activo. */
export function unlockAudio(): boolean {
  // <audio> silencioso dentro del toque: en iPhone hace que el sonido salga por el canal
  // multimedia (no depende del interruptor de silencio) y habilita el respaldo.
  if (!htmlUnlocked) {
    try {
      const el = new Audio(wavFor('silence', [[440, 0, 0.05, 0]]));
      el.setAttribute('playsinline', '');
      void el
        .play()
        .then(() => {
          htmlUnlocked = true;
          notify();
        })
        .catch((e) => {
          lastError = String(e?.name ?? e);
          notify();
        });
    } catch (e) {
      lastError = String((e as Error)?.message ?? e);
    }
  }
  const a = ensureContext();
  if (a) {
    if (a.state !== 'running') void a.resume().then(notify).catch((e) => (lastError = String(e?.name ?? e)));
    try {
      const src = a.createBufferSource();
      src.buffer = a.createBuffer(1, 1, 22050);
      src.connect(a.destination);
      src.start(0);
    } catch {
      /* nada */
    }
  }
  notify();
  return !!a && a.state === 'running' && htmlUnlocked;
}

if (typeof window !== 'undefined') {
  const events = ['pointerdown', 'touchend', 'click', 'keydown'];
  const handler = () => {
    if (unlockAudio()) events.forEach((ev) => window.removeEventListener(ev, handler, true));
  };
  events.forEach((ev) => window.addEventListener(ev, handler, true));
}

// ---------- Reproducción ----------

function playWeb(a: AudioContext, notes: Note[]) {
  for (const [freq, start, dur, vol, endFreq] of notes) {
    const t = a.currentTime + start;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, Math.min(0.6, vol * LEVEL)), t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(master!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
}

/** Reproduce por Web Audio si está activo; si no, por el respaldo <audio>. */
function play(name: string, notes: Note[], force = false) {
  if (!force && (!enabled || volume <= 0)) return;
  const a = ensureContext();
  if (a && a.state === 'running' && master) {
    try {
      playWeb(a, notes);
      return;
    } catch (e) {
      lastError = String((e as Error)?.message ?? e);
    }
  }
  if (a && a.state !== 'running') void a.resume().catch(() => {});
  playHtml(name, notes, force && volume <= 0 ? 0.6 : volume);
}

export const sfx = Object.fromEntries(
  (Object.keys(SOUNDS) as SoundName[]).map((k) => [k, () => play(k, SOUNDS[k])]),
) as Record<SoundName, () => void>;

/** Volumen 0 a 100 y silencio, desde el menú del operador. */
export function setSound(on: boolean, vol0to100: number) {
  enabled = on;
  volume = Math.max(0, Math.min(100, vol0to100)) / 100;
  if (master) master.gain.value = enabled ? volume : 0;
  if (!enabled || volume <= 0) stopMusic();
}

/** "Probar sonido": suena siempre (aunque esté silenciado o en 0). */
export function testSound() {
  unlockAudio();
  if (master) master.gain.value = volume > 0 ? volume : 0.6;
  play('correct', SOUNDS.correct, true);
  window.setTimeout(() => master && (master.gain.value = enabled ? volume : 0), 900);
}

/** Música de fondo suave (apagada por defecto): notas de campana espaciadas, en bucle. */
export function startMusic() {
  if (musicTimer !== null || !enabled || volume <= 0) return;
  const notes = [523, 659, 784, 659, 587, 698, 880, 698];
  let i = 0;
  const step = () => {
    const f = notes[i % notes.length];
    play(`music${i % notes.length}`, [
      [f, 0, 1.4, 0.035],
      [f / 2, 0, 1.6, 0.02],
    ]);
    i++;
  };
  step();
  musicTimer = window.setInterval(step, 900);
}

export function stopMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
}
