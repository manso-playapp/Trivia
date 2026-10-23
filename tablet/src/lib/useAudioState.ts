import { useEffect, useState } from 'react';
import { audioState, onAudioState, type AudioState } from './sound';

/** Estado real del audio (activo / bloqueado por el navegador). */
export function useAudioState(): AudioState {
  const [state, setState] = useState<AudioState>(audioState);
  useEffect(() => onAudioState(setState), []);
  return state;
}
