import type { CSSProperties } from 'react';
import { useConfig } from '../lib/configContext';

/**
 * Pollito de PERFIL (mirando a la derecha), por capas: cola, cuerpo, ala pegada al cuerpo,
 * cabeza, ojo, pico y dos patas que alternan al caminar. Los pollitos no vuelan:
 * el ala nunca se mueve. Colores desde la configuración.
 */
export function ChickSide({ size = 90, walking = true, style, className = '' }: { size?: number; walking?: boolean; style?: CSSProperties; className?: string }) {
  const { chick: c } = useConfig();
  return (
    <svg
      className={`chick-side ${walking ? 'chick-side--walk' : ''} ${className}`}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={style}
      aria-hidden="true"
    >
      <g className="cs__all">
        <g className="cs__leg cs__leg--back" stroke={c.legs} strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M92 160 L90 186" />
          <path d="M90 186 L104 188 M90 186 L100 194" strokeWidth="5" />
        </g>
        <g className="cs__leg cs__leg--front" stroke={c.legs} strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M112 160 L114 186" />
          <path d="M114 186 L128 188 M114 186 L124 194" strokeWidth="5" />
        </g>
        <g className="cs__body">
          <path className="cs__tail" d="M40 108 C26 98 22 86 30 80 C34 92 42 98 52 100 Z" fill={c.bodyShade} />
          <ellipse cx="96" cy="122" rx="58" ry="46" fill={c.body} />
          <ellipse cx="100" cy="146" rx="40" ry="16" fill={c.bodyShade} opacity="0.35" />
          {/* ala cerrada, pegada al cuerpo */}
          <path d="M66 112 C78 98 108 100 118 116 C110 134 82 138 66 124 Z" fill={c.bodyShade} />
        </g>
        <g className="cs__head">
          <path d="M138 34 C134 24 140 18 146 18 C142 24 146 30 146 36 Z" fill={c.bodyShade} />
          <circle cx="142" cy="72" r="36" fill={c.body} />
          <circle cx="146" cy="84" r="6" fill={c.cheek} opacity="0.55" />
          <ellipse cx="154" cy="66" rx={5.5 * c.eyeScale} ry={7 * c.eyeScale} fill={c.eye} />
          <circle cx={155.5 + c.eyeScale} cy={63.5 - c.eyeScale} r={1.9 * c.eyeScale} fill="#fff" />
          <path d="M174 70 L192 77 L174 84 Q170 77 174 70 Z" fill={c.beak} />
        </g>
      </g>
    </svg>
  );
}
