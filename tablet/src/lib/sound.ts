// Sonidos PROPIOS, generados en el momento con Web Audio: no hay archivos de audio,
// no se necesita internet y no hay licencias de terceros.
// El navegador solo permite sonar después de un toque: el primer sonido es el toque de la portada.
// Android aplica además el volumen "multimedia" del equipo: con ese volumen en 0, no suena nada.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.7;
let musicTimer: number | null = null;

function audio(): AudioContext | null {
  if (!enabled || volume <= 0) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    master!.gain.value = volume;
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Volumen 0 a 100 y silencio, desde el menú del operador. */
export function setSound(on: boolean, vol0to100: number) {
  enabled = on;
  volume = Math.max(0, Math.min(100, vol0to100)) / 100;
  if (master) master.gain.value = enabled ? volume : 0;
  if (!enabled || volume <= 0) stopMusic();
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
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
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
