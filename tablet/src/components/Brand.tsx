import { useRef, type MouseEvent, type ReactNode } from 'react';
import { useConfig } from '../lib/configContext';

/**
 * Logo de la marca. Sobre el fondo de color usa la versión en blanco si está cargada;
 * si no, el logo común dentro de un círculo blanco.
 * Mantenerlo apretado 3 segundos abre el menú del operador (oculto para el público).
 */
export function BrandBadge({ onLongPress, size = 96, light = false }: { onLongPress?: () => void; size?: number; light?: boolean }) {
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
  const handlers = { onPointerDown: start, onPointerUp: cancel, onPointerLeave: cancel, onContextMenu: (e: MouseEvent) => e.preventDefault() };

  // Sobre fondo blanco: logo a color, sin círculo.
  if (light && theme.logo) {
    return (
      <div className="brand-logo" {...handlers}>
        <img src={theme.logo} alt={theme.brandName} draggable={false} style={{ height: size * 0.8 }} />
      </div>
    );
  }
  if (theme.logoOnBrand) {
    return (
      <div className="brand-logo" {...handlers}>
        <img src={theme.logoOnBrand} alt={theme.brandName} draggable={false} style={{ height: size * 0.8 }} />
      </div>
    );
  }
  return (
    <div className="brand-badge" style={{ width: size, height: size, padding: size * 0.12 }} {...handlers}>
      {theme.logo ? <img src={theme.logo} alt={theme.brandName} draggable={false} /> : <span style={{ fontSize: size * 0.17 }}>{theme.brandName}</span>}
    </div>
  );
}

/** Banda inclinada de la marca con un texto adentro (paralelogramo). */
export function Band({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`band ${className}`}>
      <span>{children}</span>
    </div>
  );
}
