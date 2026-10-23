// Sonidos sintetizados en el momento: no hay archivos de audio y funcionan sin internet.

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  tap: () => tone(660, 0, 0.08, 'triangle', 0.08),
  count: () => tone(523, 0, 0.18, 'triangle'),
  go: () => {
    tone(784, 0, 0.15, 'triangle');
    tone(1047, 0.12, 0.25, 'triangle');
  },
  tick: () => tone(1200, 0, 0.05, 'square', 0.04),
  correct: () => {
    tone(659, 0, 0.12, 'triangle');
    tone(880, 0.1, 0.12, 'triangle');
    tone(1319, 0.2, 0.22, 'triangle');
  },
  wrong: () => {
    tone(330, 0, 0.15, 'sine', 0.15);
    tone(247, 0.12, 0.25, 'sine', 0.15);
  },
  celebrate: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.14));
  },
};
