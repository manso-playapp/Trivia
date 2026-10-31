export type FellerMode = 'facil' | 'dificil';

export const MODES: Record<FellerMode, { label: string; needed: number; total: number }> = {
  facil: { label: 'Fácil', needed: 3, total: 5 },
  dificil: { label: 'Difícil', needed: 4, total: 5 },
};

export function isFellerMode(v: string): v is FellerMode {
  return v === 'facil' || v === 'dificil';
}

export function hasWon(mode: FellerMode, correct: number): boolean {
  return correct >= MODES[mode].needed;
}

export const FRASE = ['Desde el origen,', 'potenciamos el valor', 'de un superalimento'];
