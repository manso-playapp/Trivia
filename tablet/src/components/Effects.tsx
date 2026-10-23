import { useMemo, type CSSProperties } from 'react';
import { useConfig } from '../lib/configContext';
import { useFrozen } from '../lib/preview';
import { ChickSide } from './ChickSide';

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

/**
 * Manada de pollitos de perfil que cruza caminando de izquierda a derecha.
 * Distintos tamaños y velocidades: los más chicos van "más lejos" (más arriba y más lentos).
 */
export function ChickParade({ count = 8, size = 96, seed = 11, loop = false }: { count?: number; size?: number; seed?: number; loop?: boolean }) {
  const frozen = useFrozen();
  const chicks = useMemo(() => {
    const r = seeded(seed * 7919 + count);
    return Array.from({ length: count }, (_, i) => {
      const depth = r(); // 0 = cerca, 1 = lejos
      return {
        key: i,
        size: Math.round(size * (1 - depth * 0.45)),
        bottom: 1 + depth * 9,
        duration: 2.2 + depth * 1.0,
        delay: i * 0.12 + r() * 0.15,
        z: Math.round((1 - depth) * 10),
        spread: 4 + (i / Math.max(1, count - 1)) * 80,
      };
    });
  }, [count, size, seed]);
  return (
    <div className="fx-layer" aria-hidden="true">
      {chicks.map((c) => (
        <div
          key={c.key}
          className="fx-parade"
          style={
            frozen
              ? { left: `${c.spread}%`, bottom: `${c.bottom}%`, zIndex: c.z, animation: 'none', transform: 'none' }
              : { bottom: `${c.bottom}%`, zIndex: c.z, animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s`, animationIterationCount: loop ? 'infinite' : 1 }
          }
        >
          <ChickSide size={c.size} />
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
