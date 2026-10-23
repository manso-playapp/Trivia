import { questionsFromCsv } from '../lib/questionsCsv';
import type { GameConfig } from './types';

// "Pack de cliente": todo lo de cada cliente vive en `packs/<nombre>/` (carpeta excluida
// del repositorio) y el juego solo lee ese pack:
//   pack.json      marca, colores, tipografías, pollito, textos y ajustes
//   preguntas.csv  preguntas (misma planilla que se carga desde el menú del operador)
//   assets/        logos y fotos (en pack.json se nombran como "asset:archivo.png")
// El pack se elige al compilar con VITE_PACK=<nombre>; si no se indica, se usa el único
// que haya. Sin packs, el juego arranca con la configuración de demostración.
const packs = import.meta.glob<DeepPartial<GameConfig>>('../../packs/*/pack.json', { eager: true, import: 'default' });
const sheets = import.meta.glob<string>('../../packs/*/preguntas.csv', { eager: true, query: '?raw', import: 'default' });
const assets = import.meta.glob<string>('../../packs/*/assets/*', { eager: true, query: '?url', import: 'default' });

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };

const names = Object.keys(packs).map((p) => p.split('/')[3]);
const wanted = import.meta.env.VITE_PACK as string | undefined;
export const packName: string | null = wanted && names.includes(wanted) ? wanted : names.length === 1 ? names[0] : null;

function resolveAssets<T>(value: T, base: string): T {
  if (typeof value === 'string' && value.startsWith('asset:')) return (assets[`${base}/assets/${value.slice(6)}`] ?? '') as T;
  if (Array.isArray(value)) return value.map((v) => resolveAssets(v, base)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveAssets(v, base)])) as T;
  }
  return value;
}

function loadPack(name: string | null): DeepPartial<GameConfig> {
  if (!name) return {};
  const base = `../../packs/${name}`;
  const pack = resolveAssets(packs[`${base}/pack.json`] ?? {}, base);
  const sheet = sheets[`${base}/preguntas.csv`];
  if (sheet) {
    const { questions } = questionsFromCsv(sheet);
    if (questions.length) return { ...pack, questions };
  }
  return pack;
}

export const clientConfig: DeepPartial<GameConfig> = loadPack(packName);
