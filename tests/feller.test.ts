import { describe, it, expect } from 'vitest';
import { hasWon } from '@/lib/feller';

describe('feller hasWon', () => {
  it('fácil gana con 3/5', () => {
    expect(hasWon('facil', 2)).toBe(false);
    expect(hasWon('facil', 3)).toBe(true);
  });
  it('difícil gana con 4/5', () => {
    expect(hasWon('dificil', 3)).toBe(false);
    expect(hasWon('dificil', 4)).toBe(true);
  });
});
