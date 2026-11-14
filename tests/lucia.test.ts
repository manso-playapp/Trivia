import { describe, expect, it } from 'vitest';
import {
  normalizeEmail,
  normalizePhone,
  prizeProbabilityTotal,
  segmentAtRotation,
  splitLabel,
  targetRotation,
  textColorFor,
  validateSegments,
  BRAND,
  drawSegment,
  parseEmailList,
  type LuciaSegment,
} from '@/lib/lucia';

const base = (): LuciaSegment[] =>
  Array.from({ length: 8 }, (_, i) => ({
    position: i,
    label: i % 2 ? 'Suerte la próxima' : `Premio ${i}`,
    kind: i % 2 ? 'lose' : 'prize',
    probability: i % 2 ? 0 : 10,
    stock: null,
    color: '#111111',
  }));

describe('lucia: teléfono y mail', () => {
  it('normaliza variantes argentinas al mismo número', () => {
    expect(normalizePhone('+54 9 351 123-4567')).toBe('3511234567');
    expect(normalizePhone('0351 1234567')).toBe('3511234567');
    expect(normalizePhone('351 123 4567')).toBe('3511234567');
  });
  it('rechaza teléfonos cortos', () => {
    expect(normalizePhone('1234')).toBeNull();
    expect(normalizePhone('')).toBeNull();
  });
  it('valida mail', () => {
    expect(normalizeEmail('  Ana@Mail.COM ')).toBe('ana@mail.com');
    expect(normalizeEmail('ana@mail')).toBeNull();
  });
});

describe('lucia: configuración de gajos', () => {
  it('acepta la config por defecto', () => {
    expect(validateSegments(base())).toEqual([]);
    expect(prizeProbabilityTotal(base())).toBe(40);
  });
  it('rechaza suma > 100', () => {
    const s = base();
    s[0].probability = 80;
    expect(validateSegments(s).join(' ')).toMatch(/no puede pasar de 100/);
  });
  it('exige al menos un "suerte la próxima"', () => {
    const s = base().map((x) => ({ ...x, kind: 'prize' as const, probability: 5 }));
    expect(validateSegments(s).join(' ')).toMatch(/Suerte la próxima/);
  });
  it('no cuenta premios sin stock', () => {
    const s = base();
    s[0].stock = 0;
    expect(prizeProbabilityTotal(s, true)).toBe(30);
  });
});

describe('lucia: ruleta', () => {
  it('la rotación final deja el gajo pedido bajo el puntero', () => {
    let rot = 0;
    for (let pos = 0; pos < 8; pos++) {
      for (const j of [0, 0.25, 0.5, 0.75, 0.999]) {
        const next = targetRotation(rot, pos, 8, j);
        expect(next).toBeGreaterThan(rot + 360 * 5);
        expect(segmentAtRotation(next, 8)).toBe(pos);
        rot = next;
      }
    }
  });
  it('parte etiquetas largas en 2 líneas', () => {
    expect(splitLabel('20% OFF')).toEqual(['20% OFF']);
    expect(splitLabel('Suerte la próxima')).toEqual(['Suerte la', 'próxima']);
  });
  it('elige texto legible', () => {
    expect(textColorFor('#76845F')).toBe(BRAND.cream);
    expect(textColorFor('#F6F4EC')).toBe(BRAND.deep);
  });
});

describe('lucia: mails de prueba y sorteo', () => {
  it('parsea la lista separada por coma', () => {
    expect(parseEmailList(' Ana@Mail.com, b@x.com;; nada, ana@mail.com ')).toEqual(['ana@mail.com', 'b@x.com']);
    expect(parseEmailList('')).toEqual([]);
  });
  it('sortea según el % y respeta el stock', () => {
    const s = base(); // premios en 0,2,4,6 con 10% c/u
    expect(drawSegment(s, 5, 0)?.position).toBe(0);
    expect(drawSegment(s, 15, 0)?.position).toBe(2);
    expect(drawSegment(s, 39.9, 0)?.position).toBe(6);
    expect(drawSegment(s, 50, 0)?.kind).toBe('lose');
    s[0].stock = 0;
    expect(drawSegment(s, 5, 0)?.position).toBe(2);
  });
});
