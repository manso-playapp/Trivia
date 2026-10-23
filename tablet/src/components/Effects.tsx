import { useMemo, type CSSProperties } from 'react';
import { useConfig } from '../lib/configContext';
import { Chick } from './Chick';

// Efectos de pantalla completa. Solo animan posición y giro (lo más liviano
// para una tablet de gama media). La cantidad de piezas está acotada.
// Regla de marca: sin huevos que caen ni se rompen.

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Pollitos que cruzan caminando por abajo de la pantalla. */
export function ChickParade({ count = 4, size = 90 }: { count?: number; size?: number }) {
  return (
    <div className="fx-layer" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="fx-parade" style={{ animationDelay: `${i * 0.22}s`, bottom: `${2 + (i % 2) * 3}%` }}>
          <Chick pose="walk" size={size} />
        </div>
      ))}
    </div>
  );
}

/** Banda inclinada (elemento gráfico de la marca) que barre la pantalla. */
export function BandSweep({ color = 'var(--surface)', delay = 0 }: { color?: string; delay?: number }) {
  return (
    <div className="fx-layer" aria-hidden="true">
      <div className="fx-band" style={{ background: color, animationDelay: `${delay}s` }} />
    </div>
  );
}

/** Papel picado en los colores de la marca. */
export function Confetti({ count = 40, seed = 3 }: { count?: number; seed?: number }) {
  const { theme } = useConfig();
  const colors = [theme.surface, theme.surface, theme.muted, theme.onBrand];
  const key = colors.join();
  const pieces = useMemo(() => {
    const r = seeded(seed * 104729 + count);
    const palette = key.split(',');
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: r() * 100,
      delay: r() * 0.8,
      duration: 1.8 + r() * 1.4,
      rotate: (r() - 0.5) * 1080,
      color: palette[i % palette.length],
      w: 8 + r() * 8,
    }));
  }, [count, seed, key]);
  return (
    <div className="fx-layer" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.key}
          className="fx-confetti"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.w * 0.45,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--rot': `${p.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
