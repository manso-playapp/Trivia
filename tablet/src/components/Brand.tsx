import { useRef } from 'react';
import { useConfig } from '../lib/configContext';

/**
 * Logo de la marca en un círculo. Mantenerlo apretado 3 segundos abre el
 * menú del operador (oculto para el público).
 */
export function BrandBadge({ onLongPress, size = 96 }: { onLongPress?: () => void; size?: number }) {
  const { theme } = useConfig();
  const timer = useRef<number | null>(null);
  const start = () => {
    if (!onLongPress) return;
    timer.current = window.setTimeout(onLongPress, 3000);
  };
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <div
      className="brand-badge"
      style={{ width: size, height: size, padding: size * 0.12 }}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {theme.logo ? <img src={theme.logo} alt={theme.brandName} draggable={false} /> : <span style={{ fontSize: size * 0.17 }}>{theme.brandName}</span>}
    </div>
  );
}
