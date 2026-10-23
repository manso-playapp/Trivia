import { defaultConfig } from '../config/defaults';
import type { GameConfig, PlayRecord } from '../config/types';

// Todo queda guardado en la tablet: el juego funciona sin internet.
const CONFIG_KEY = 'trivia.config.v1';
const PLAYS_KEY = 'trivia.plays.v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // almacenamiento lleno o bloqueado: el juego sigue funcionando
  }
}

/** Mezcla lo guardado con los valores de fábrica, por si faltan campos nuevos. */
export function mergeConfig(saved: Partial<GameConfig> | null): GameConfig {
  if (!saved) return defaultConfig;
  return {
    version: 1,
    theme: { ...defaultConfig.theme, ...saved.theme },
    chick: { ...defaultConfig.chick, ...saved.chick },
    egg: { ...defaultConfig.egg, ...saved.egg },
    texts: { ...defaultConfig.texts, ...saved.texts },
    settings: { ...defaultConfig.settings, ...saved.settings },
    questions: saved.questions?.length ? saved.questions : defaultConfig.questions,
  };
}

export function loadConfig(): GameConfig {
  return mergeConfig(read<Partial<GameConfig>>(CONFIG_KEY));
}

export function saveConfig(config: GameConfig): void {
  write(CONFIG_KEY, config);
}

export function resetConfig(): void {
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch {
    /* nada */
  }
}

export function loadPlays(): PlayRecord[] {
  return read<PlayRecord[]>(PLAYS_KEY) ?? [];
}

export function addPlay(play: PlayRecord): PlayRecord[] {
  const plays = [...loadPlays(), play];
  write(PLAYS_KEY, plays);
  return plays;
}

export function savePlays(plays: PlayRecord[]): void {
  write(PLAYS_KEY, plays);
}
