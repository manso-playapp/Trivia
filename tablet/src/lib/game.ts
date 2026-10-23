import type { PlayRecord, Question } from '../config/types';

/** Elige `count` preguntas activas al azar, sin repetir. */
export function pickQuestions(all: Question[], count: number, random: () => number = Math.random): Question[] {
  const pool = all.filter((q) => q.active && q.options.length >= 2 && q.correct < q.options.length);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/** 100 puntos por acierto + hasta 50 por rapidez. */
export function scoreFor(correct: boolean, secondsLeft: number, secondsTotal: number): number {
  if (!correct) return 0;
  const ratio = Math.max(0, Math.min(1, secondsLeft / secondsTotal));
  return 100 + Math.round(50 * ratio);
}

function sameDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/** Ranking del día: mejor puntaje primero; a igual puntaje, el que jugó antes. */
export function dailyRanking(plays: PlayRecord[], now: Date = new Date(), limit = 10): PlayRecord[] {
  return plays
    .filter((p) => sameDay(p.playedAt, now))
    .sort((a, b) => b.score - a.score || a.playedAt.localeCompare(b.playedAt))
    .slice(0, limit);
}
