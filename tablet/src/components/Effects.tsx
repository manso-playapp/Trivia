import { useMemo, type CSSProperties } from 'react';
import { useConfig } from '../lib/configContext';
import { Chick } from './Chick';
import { Egg } from './Egg';

// Efectos de pantalla completa. Solo animan posición y giro (lo más liviano
// para una tablet de gama media). La cantidad de piezas está acotada.

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Lluvia de huevos. `pile` = los huevos quedan apilados abajo (pantalla que se llena).
 */
export function EggRain({ count = 28, pile = false, seed = 1 }: { count?: number; pile?: boolean; seed?: number }) {
  const eggs = useMemo(() => {
    const r = seeded(seed * 7919 + count);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: r() * 92,
      size: 34 + r() * 30,
      delay: r() * (pile ? 1.4 : 0.5),
      duration: 1.1 + r() * 0.9,
      rotate: (r() - 0.5) * 540,
      end: pile ? 62 + r() * 30 : 115,
    }));
  }, [count, pile, seed]);
  return (
    <div className="fx-layer" aria-hidden="true">
      {eggs.map((e) => (
        <div
          key={e.key}
          className={`fx-egg ${pile ? 'fx-egg--pile' : ''}`}
          style={
            {
              left: `${e.left}%`,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              '--rot': `${e.rotate}deg`,
              '--end': `${e.end}vh`,
            } as CSSProperties
          }
        >
          <Egg size={e.size} />
        </div>
      ))}
    </div>
  );
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

/** Papel picado en los colores de la marca. */
export function Confetti({ count = 40, seed = 3 }: { count?: number; seed?: number }) {
  const { theme, chick } = useConfig();
  const colors = [theme.brand, theme.surface, chick.body, theme.pattern];
  const pieces = useMemo(() => {
    const r = seeded(seed * 104729 + count);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: r() * 100,
      delay: r() * 0.8,
      duration: 1.8 + r() * 1.4,
      rotate: (r() - 0.5) * 1080,
      color: colors[i % colors.length],
      w: 8 + r() * 8,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed, colors.join()]);
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
