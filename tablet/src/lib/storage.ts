import { clientConfig } from '../config/client';
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

function mergeInto(base: GameConfig, over: Partial<GameConfig> | null | undefined): GameConfig {
  if (!over) return base;
  return {
    version: 1,
    theme: { ...base.theme, ...over.theme },
    chick: { ...base.chick, ...over.chick },
    texts: { ...base.texts, ...over.texts },
    settings: { ...base.settings, ...over.settings },
    questions: over.questions?.length ? over.questions : base.questions,
  };
}

/** Configuración de fábrica: demostración + marca del cliente (si el build la incluye). */
export const factoryConfig: GameConfig = mergeInto(defaultConfig, clientConfig as Partial<GameConfig>);

/** Mezcla lo guardado con los valores de fábrica, por si faltan campos nuevos. */
export function mergeConfig(saved: Partial<GameConfig> | null): GameConfig {
  return mergeInto(factoryConfig, saved);
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
