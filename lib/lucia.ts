// Lógica compartida de la ruleta Lucía (cliente y servidor). Sin dependencias.

export const SEGMENT_COUNT = 8;

export type SegmentKind = 'prize' | 'lose';

export interface LuciaSegment {
  position: number;
  label: string;
  kind: SegmentKind;
  probability: number; // % por tiro (sólo premios)
  stock: number | null; // null = ilimitado
  color: string;
}

/** Lo que ve el jugador: nunca se exponen probabilidades ni stock. */
export interface PublicSegment {
  position: number;
  label: string;
  color: string;
}

export interface LuciaSettings {
  active: boolean;
  voucher_phrase: string;
  valid_until: string; // YYYY-MM-DD
  legal_text: string;
}

export interface SpinResult {
  position: number;
  label: string;
  won: boolean;
  code: string | null;
  phrase: string;
  legal: string;
  valid_until: string;
}

/**
 * Normaliza un teléfono a sólo dígitos. Para Argentina quita 54, el 9 de
 * celulares y el 0 inicial, así "+54 9 351 ..." y "0351 ..." cuentan igual.
 * Devuelve null si no parece un teléfono válido.
 */
export function normalizePhone(raw: string): string | null {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('54') && d.length >= 12) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length < 8 || d.length > 15) return null;
  return d;
}

export function normalizeEmail(raw: string): string | null {
  const e = (raw || '').trim().toLowerCase();
  if (e.length > 120) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Valida la configuración de gajos. Devuelve una lista de errores (vacía = ok). */
export function validateSegments(segments: LuciaSegment[]): string[] {
  const errors: string[] = [];
  if (segments.length !== SEGMENT_COUNT) errors.push(`Tiene que haber ${SEGMENT_COUNT} gajos.`);
  const positions = new Set(segments.map((s) => s.position));
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    if (!positions.has(i)) errors.push(`Falta el gajo ${i + 1}.`);
  }
  segments.forEach((s) => {
    const n = `Gajo ${s.position + 1}`;
    if (!s.label.trim()) errors.push(`${n}: falta el nombre.`);
    if (s.label.length > 40) errors.push(`${n}: el nombre es muy largo (máx. 40).`);
    if (s.kind !== 'prize' && s.kind !== 'lose') errors.push(`${n}: tipo inválido.`);
    if (!HEX.test(s.color)) errors.push(`${n}: color inválido.`);
    if (s.kind === 'prize') {
      if (!Number.isFinite(s.probability) || s.probability < 0 || s.probability > 100) {
        errors.push(`${n}: el % tiene que estar entre 0 y 100.`);
      }
      if (s.stock !== null && (!Number.isInteger(s.stock) || s.stock < 0)) {
        errors.push(`${n}: el stock tiene que ser un número entero (o vacío = ilimitado).`);
      }
    }
  });
  if (!segments.some((s) => s.kind === 'lose')) {
    errors.push('Tiene que haber al menos un gajo de "Suerte la próxima".');
  }
  const total = prizeProbabilityTotal(segments);
  if (total > 100) errors.push(`La suma de % de premios es ${round2(total)}%: no puede pasar de 100%.`);
  return errors;
}

/** Suma de % de premios configurados (sin contar stock agotado si onlyAvailable). */
export function prizeProbabilityTotal(segments: LuciaSegment[], onlyAvailable = false): number {
  return segments
    .filter((s) => s.kind === 'prize')
    .filter((s) => !onlyAvailable || s.stock === null || s.stock > 0)
    .reduce((acc, s) => acc + (Number(s.probability) || 0), 0);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Rotación final (grados, sentido horario) para que el gajo `position` quede
 * bajo el puntero superior. Siempre suma al menos `turns` vueltas completas.
 * `jitter` en [0,1) desplaza la caída dentro del gajo para que no sea siempre al centro.
 */
export function targetRotation(
  current: number,
  position: number,
  count = SEGMENT_COUNT,
  jitter = 0.5,
  turns = 6,
): number {
  const seg = 360 / count;
  const center = (position + 0.5) * seg + (jitter - 0.5) * seg * 0.6;
  const wanted = mod(-center, 360);
  const base = current - mod(current, 360) + turns * 360;
  return base + wanted;
}

/** Qué gajo queda bajo el puntero para una rotación dada (inverso de targetRotation). */
export function segmentAtRotation(rotation: number, count = SEGMENT_COUNT): number {
  const seg = 360 / count;
  return Math.floor(mod(-rotation, 360) / seg) % count;
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Color de texto legible sobre un fondo dado. */
export function textColorFor(hex: string): string {
  if (!HEX.test(hex)) return '#111111';
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.45 ? '#111111' : '#F4F0E4';
}

/** Parte un nombre en hasta 2 líneas para que entre en el gajo. */
export function splitLabel(label: string, maxLine = 11): string[] {
  const t = label.trim();
  if (t.length <= maxLine || !t.includes(' ')) return [t];
  const words = t.split(/\s+/);
  let best: string[] = [t];
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.max(a.length, b.length);
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return best;
}

/** "2026-12-31" -> "31/12/2026" */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export const BRAND = {
  olive: '#B2AC82',
  oliveDark: '#8C8762',
  cream: '#F1EDE0',
  ink: '#111111',
};
