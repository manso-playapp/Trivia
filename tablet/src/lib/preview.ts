import { createContext, useContext } from 'react';

/** En la galería de escenas fijas: sin relojes ni pasos automáticos. */
export const PreviewContext = createContext(false);

export function useFrozen(): boolean {
  return useContext(PreviewContext);
}
