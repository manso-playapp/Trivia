import { createContext, useContext } from 'react';
import { defaultConfig } from '../config/defaults';
import type { GameConfig } from '../config/types';

export const ConfigContext = createContext<GameConfig>(defaultConfig);

export function useConfig(): GameConfig {
  return useContext(ConfigContext);
}
