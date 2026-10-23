// Sonidos PROPIOS, generados en el momento con Web Audio: no hay archivos de audio,
// no se necesita internet y no hay licencias de terceros.
// Los navegadores solo dejan sonar después de un toque: en CUALQUIER toque se intenta
// "desbloquear" el audio (se reintenta en cada toque hasta que quede activo).
// Android aplica además el volumen "multimedia" del equipo: con ese volumen en 0, no suena nada.

export type AudioState = 'running' | 'blocked' | 'unsupported';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.7;
let musicTimer: number | null = null;
const listeners = new Set<(s: AudioState) => void>();

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
  } catch {
    return null;
  }
}

export function audioState(): AudioState {
  if (!ctx) return typeof window !== 'undefined' && (window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext) ? 'blocked' : 'unsupported';
  return ctx.state === 'running' ? 'running' : 'blocked';
}

function notify() {
  const s = audioState();
  listeners.forEach((fn) => fn(s));
}

export function onAudioState(fn: (s: AudioState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Archivo WAV de silencio (generado acá): en iPhone, reproducir un <audio> dentro del toque
// hace que el sonido salga por el canal multimedia y no dependa del interruptor de silencio.
let silentUrl: string | null = null;
function silentWav(): string {
  if (silentUrl) return silentUrl;
  const samples = 800;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const w = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + samples, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  silentUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return silentUrl;
}

let htmlUnlocked = false;
/** Se llama dentro de un toque. Devuelve true si el audio quedó activo. */
export function unlockAudio(): boolean {
  const a = ensureContext();
  if (!a) return false;
  if (!htmlUnlocked) {
    try {
      const el = new Audio(silentWav());
      el.setAttribute('playsinline', '');
      void el.play().then(() => (htmlUnlocked = true)).catch(() => {});
    } catch {
      /* nada */
    }
  }
  if (a.state !== 'running') void a.resume().then(notify).catch(() => {});
  // Un sonido vacío dentro del toque termina de habilitar el audio en algunos equipos.
  try {
    const src = a.createBufferSource();
    src.buffer = a.createBuffer(1, 1, 22050);
    src.connect(a.destination);
    src.start(0);
  } catch {
    /* nada */
  }
  notify();
  return a.state === 'running';
}

// Desbloqueo en cualquier toque (se reintenta hasta que quede activo).
if (typeof window !== 'undefined') {
  const handler = () => {
    if (unlockAudio() && htmlUnlocked) {
      ['pointerdown', 'touchend', 'click', 'keydown'].forEach((ev) => window.removeEventListener(ev, handler, true));
    }
  };
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach((ev) => window.addEventListener(ev, handler, true));
}

function audio(): AudioContext | null {
  if (!enabled || volume <= 0) return null;
  const a = ensureContext();
  if (!a) return null;
  if (a.state !== 'running') void a.resume().catch(() => {});
  return a;
}

/** Volumen 0 a 100 y silencio, desde el menú del operador. */
export function setSound(on: boolean, vol0to100: number) {
  enabled = on;
  volume = Math.max(0, Math.min(100, vol0to100)) / 100;
  if (master) master.gain.value = enabled ? volume : 0;
  if (!enabled || volume <= 0) stopMusic();
}

/** "Probar sonido": suena siempre (aunque esté silenciado o en 0), con el volumen elegido o al 60 %. */
export function testSound() {
  unlockAudio();
  const prevEnabled = enabled;
  const prevVolume = volume;
  enabled = true;
  volume = prevVolume > 0 ? prevVolume : 0.6;
  if (master) master.gain.value = volume;
  sfx.correct();
  enabled = prevEnabled;
  volume = prevVolume;
  window.setTimeout(() => master && (master.gain.value = enabled ? volume : 0), 900);
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, endFreq?: number) {
  const a = audio();
  if (!a || !master) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  // Niveles pensados para el parlante de una tablet en un stand con ruido.
  gain.gain.exponentialRampToValueAtTime(Math.min(0.6, vol * 2.5), t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** "Pío" de pollito: silbido corto que sube y baja. */
function chirp(start = 0, pitch = 1) {
  tone(2400 * pitch, start, 0.07, 'sine', 0.07, 3400 * pitch);
  tone(3300 * pitch, start + 0.07, 0.08, 'sine', 0.06, 2500 * pitch);
}

/** Campanita: fundamental + armónico, con caída suave. */
function bell(freq: number, start = 0, vol = 0.12) {
  tone(freq, start, 0.6, 'sine', vol);
  tone(freq * 2.76, start, 0.35, 'sine', vol * 0.25);
}

export const sfx = {
  /** toque suave en botones */
  tap: () => tone(880, 0, 0.06, 'sine', 0.06),
  /** tic del 3-2-1 */
  count: () => tone(1046, 0, 0.09, 'triangle', 0.09),
  /** arranque ("¡A jugar!") */
  go: () => {
    tone(784, 0, 0.12, 'triangle', 0.1);
    tone(1175, 0.1, 0.22, 'triangle', 0.1);
    chirp(0.25);
  },
  /** tic de los últimos 5 segundos (muy bajito) */
  tick: () => tone(1500, 0, 0.03, 'sine', 0.025),
  /** acierto: campanita + pío */
  correct: () => {
    bell(1318);
    bell(1760, 0.09, 0.1);
    chirp(0.3);
  },
  /** error amable: dos notas suaves que bajan, sin zumbido */
  wrong: () => {
    tone(523, 0, 0.22, 'sine', 0.07);
    tone(440, 0.16, 0.32, 'sine', 0.06);
  },
  /** festejo final: arpegio corto + píos de la manada */
  celebrate: () => {
    [784, 988, 1175, 1568].forEach((f, i) => bell(f, i * 0.11, 0.09));
    [0.55, 0.75, 0.9, 1.1, 1.3].forEach((t, i) => chirp(t, 0.92 + (i % 3) * 0.06));
  },
};

/** Música de fondo suave (apagada por defecto): notas de campana espaciadas, en bucle. */
export function startMusic() {
  if (musicTimer !== null || !audio()) return;
  const notes = [523, 659, 784, 659, 587, 698, 880, 698];
  let i = 0;
  const play = () => {
    const f = notes[i % notes.length];
    tone(f, 0, 1.4, 'sine', 0.035);
    tone(f / 2, 0, 1.6, 'sine', 0.02);
    i++;
  };
  play();
  musicTimer = window.setInterval(play, 900);
}

export function stopMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
}
