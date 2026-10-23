import { describe, expect, it } from 'vitest';
import type { PlayRecord, Question } from '../config/types';
import { dailyRanking, pickQuestions, scoreFor } from './game';
import { emailSuggestions, emailTypoFix, isValidEmail, isValidPhone } from './email';
import { playsToCsv } from './csv';

const q = (id: string, active = true): Question => ({ id, text: id, options: ['a', 'b', 'c'], correct: 0, active });

describe('pickQuestions', () => {
  it('elige la cantidad pedida, sin repetir y solo activas', () => {
    const all = [q('1'), q('2'), q('3', false), q('4'), q('5'), q('6'), q('7')];
    const picked = pickQuestions(all, 5);
    expect(picked).toHaveLength(5);
    expect(new Set(picked.map((x) => x.id)).size).toBe(5);
    expect(picked.some((x) => x.id === '3')).toBe(false);
  });
  it('si hay menos preguntas que las pedidas, devuelve las que hay', () => {
    expect(pickQuestions([q('1'), q('2')], 5)).toHaveLength(2);
  });
  it('descarta preguntas con respuesta correcta fuera de rango', () => {
    expect(pickQuestions([{ ...q('x'), correct: 5 }], 5)).toHaveLength(0);
  });
});

describe('scoreFor', () => {
  it('0 si es incorrecta, 100 a 150 si es correcta', () => {
    expect(scoreFor(false, 10, 15)).toBe(0);
    expect(scoreFor(true, 0, 15)).toBe(100);
    expect(scoreFor(true, 15, 15)).toBe(150);
  });
});

describe('dailyRanking', () => {
  const play = (id: string, score: number, at: string): PlayRecord => ({
    id, device: 'T1', playedAt: at, name: id, email: '', phone: '', consent: false, correct: 0, total: 5, score,
  });
  it('solo partidas de hoy, de mayor a menor puntaje', () => {
    const now = new Date('2026-11-02T15:00:00');
    const rows = dailyRanking(
      [play('a', 300, '2026-11-02T10:00:00'), play('b', 500, '2026-11-02T11:00:00'), play('c', 900, '2026-11-01T11:00:00')],
      now,
    );
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('email', () => {
  it('sugiere dominios comunes mientras se escribe', () => {
    expect(emailSuggestions('juan')).toEqual(['juan@gmail.com', 'juan@hotmail.com', 'juan@outlook.com', 'juan@yahoo.com']);
    expect(emailSuggestions('juan@ho')).toEqual(['juan@hotmail.com']);
    expect(emailSuggestions('juan@gmail.com')).toEqual([]);
    expect(emailSuggestions('')).toEqual([]);
  });
  it('corrige errores comunes', () => {
    expect(emailTypoFix('ana@gmial.com')).toBe('ana@gmail.com');
    expect(emailTypoFix('ana@gmail.com')).toBeNull();
  });
  it('valida mail y teléfono', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidPhone('351 555 1234')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
  });
});

describe('csv', () => {
  it('arma la planilla con encabezado y escapa comillas', () => {
    const csv = playsToCsv([
      { id: '1', device: 'Tablet 1', playedAt: '2026-11-02T10:00:00', name: 'Ana "la" Pérez', email: 'a@b.com', phone: '', consent: true, correct: 4, total: 5, score: 520 },
    ]);
    expect(csv.startsWith('﻿tablet;fecha')).toBe(true);
    expect(csv).toContain('"Ana ""la"" Pérez"');
    expect(csv).toContain(';si;4;5;520');
  });
});
