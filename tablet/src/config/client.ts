import type { GameConfig } from './types';

// Marca del cliente para el build de la tablet. Vive en `client-data/` (excluida del
// repositorio): `config.json` + imágenes en `client-data/assets/`. Si la carpeta no
// existe, el juego usa la configuración de demostración.
const configs = import.meta.glob<DeepPartial<GameConfig>>('../../client-data/config.json', { eager: true, import: 'default' });
const assets = import.meta.glob<string>('../../client-data/assets/*', { eager: true, query: '?url', import: 'default' });

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };

function resolveAssets<T>(value: T): T {
  if (typeof value === 'string' && value.startsWith('asset:')) {
    const name = value.slice(6);
    return (assets[`../../client-data/assets/${name}`] ?? '') as T;
  }
  if (Array.isArray(value)) return value.map(resolveAssets) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveAssets(v)])) as T;
  }
  return value;
}

export const clientConfig: DeepPartial<GameConfig> = resolveAssets(Object.values(configs)[0] ?? {});
