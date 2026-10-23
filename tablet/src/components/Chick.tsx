import type { CSSProperties } from 'react';
import { useConfig } from '../lib/configContext';

/** Movimientos creíbles de un pollito: no vuela ni aletea. */
export type ChickPose = 'idle' | 'hop' | 'peck' | 'surprised' | 'tilt';

interface Props {
  pose?: ChickPose;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  /** mira hacia la izquierda */
  flip?: boolean;
}

/**
 * Pollito dibujado por capas (patas, alas, cuerpo, cabeza, ojos, pico).
 * Cada capa se anima por CSS según la pose (ver styles.css, sección "Pollito"). Las alas
 * quedan siempre pegadas al cuerpo.
 * Colores y proporciones salen de la configuración: se ajustan sin tocar el dibujo.
 */
export function Chick({ pose = 'idle', size = 160, className = '', style, flip = false }: Props) {
  const { chick: c } = useConfig();
  const eye = 1 * c.eyeScale;
  const mouthOpen = pose === 'hop' || pose === 'surprised';
  return (
    <svg
      className={`chick chick--${pose} ${flip ? 'chick--flip' : ''} ${className}`}
      viewBox="0 0 200 220"
      width={size}
      height={size}
      style={style}
      aria-hidden="true"
    >
      <g className="chick__all">
        <g className="chick__legs" stroke={c.legs} strokeWidth="6" strokeLinecap="round" fill="none">
          <g className="chick__leg chick__leg--l">
            <path d="M86 176 L83 202" />
            <path d="M83 202 L71 207 M83 202 L83 211 M83 202 L94 207" strokeWidth="5" />
          </g>
          <g className="chick__leg chick__leg--r">
            <path d="M114 176 L117 202" />
            <path d="M117 202 L106 207 M117 202 L117 211 M117 202 L129 207" strokeWidth="5" />
          </g>
        </g>

        <g className="chick__wing chick__wing--l">
          <ellipse cx="50" cy="132" rx="17" ry="29" transform="rotate(22 50 132)" fill={c.bodyShade} />
        </g>
        <g className="chick__wing chick__wing--r">
          <ellipse cx="150" cy="132" rx="17" ry="29" transform="rotate(-22 150 132)" fill={c.bodyShade} />
        </g>

        <g className="chick__body">
          <ellipse cx="100" cy="136" rx="58" ry="52" fill={c.body} />
          <ellipse cx="100" cy="160" rx="40" ry="20" fill={c.bodyShade} opacity="0.35" />
        </g>

        <g className="chick__head">
          <g transform={`translate(100 80) scale(${c.headScale}) translate(-100 -80)`}>
          <g className="chick__tuft" fill={c.bodyShade}>
            <path d="M100 40 C94 26 98 18 104 16 C102 24 106 30 104 40 Z" />
            <path d="M96 42 C86 34 84 26 88 22 C90 30 96 34 100 40 Z" />
            <path d="M104 42 C114 34 118 28 116 22 C112 30 106 34 100 40 Z" />
          </g>
          <circle cx="100" cy="80" r="44" fill={c.body} />
          <circle className="chick__cheek" cx="71" cy="94" r="7.5" fill={c.cheek} opacity="0.6" />
          <circle className="chick__cheek" cx="129" cy="94" r="7.5" fill={c.cheek} opacity="0.6" />
          <g className="chick__eyes">
            <ellipse cx="84" cy="77" rx={6.5 * eye} ry={8 * eye} fill={c.eye} />
            <ellipse cx="116" cy="77" rx={6.5 * eye} ry={8 * eye} fill={c.eye} />
            <circle cx={86 + 1.5 * eye} cy={74 - 1.5 * eye} r={2.2 * eye} fill="#fff" />
            <circle cx={118 + 1.5 * eye} cy={74 - 1.5 * eye} r={2.2 * eye} fill="#fff" />
          </g>
          <g className="chick__beak" fill={c.beak}>
            <path d="M91 89 Q100 85 109 89 L100 99 Z" />
            <path
              className="chick__mouth"
              d="M93 98 L107 98 L100 106 Z"
              opacity={mouthOpen ? 1 : 0}
              style={{ filter: 'brightness(0.85)' }}
            />
          </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
