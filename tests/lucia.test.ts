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
    expect(textColorFor('#111111')).not.toBe('#111111');
    expect(textColorFor('#F1EDE0')).toBe('#111111');
  });
});
