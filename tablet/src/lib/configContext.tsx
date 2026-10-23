import { createContext, useContext } from 'react';
import { factoryConfig } from './storage';
import type { GameConfig } from '../config/types';

export const ConfigContext = createContext<GameConfig>(factoryConfig);

export function useConfig(): GameConfig {
  return useContext(ConfigContext);
}
