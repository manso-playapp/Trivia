'use client';

import React from 'react';
import { splitLabel, textColorFor, type PublicSegment } from '@/lib/lucia';

const R = 250; // radio de la cara
const RIM = 22; // aro exterior

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180; // 0° = arriba, sentido horario
  return [r * Math.cos(a), r * Math.sin(a)] as const;
}

function slicePath(i: number, n: number) {
  const seg = 360 / n;
  const [x0, y0] = polar(R, i * seg);
  const [x1, y1] = polar(R, (i + 1) * seg);
  return `M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

interface Props {
  segments: PublicSegment[];
  rotation: number;
  durationMs?: number;
  onSpinEnd?: () => void;
}

export default function Wheel({ segments, rotation, durationMs = 5600, onSpinEnd }: Props) {
  const n = segments.length || 8;
  const seg = 360 / n;
  const bulbs = Array.from({ length: n * 2 }, (_, i) => polar(R + RIM / 2, (i * 360) / (n * 2)));

  return (
    <div className="lw">
      <div className="lw-pointer" aria-hidden>
        <svg viewBox="0 0 40 52" width="40" height="52">
          <path d="M20 50 L3 12 A18 18 0 1 1 37 12 Z" fill="#111" />
          <circle cx="20" cy="17" r="6" fill="#B2AC82" />
        </svg>
      </div>
      <div
        className="lw-rotor"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: durationMs ? `transform ${durationMs}ms cubic-bezier(0.12, 0.62, 0.08, 1)` : 'none',
        }}
        onTransitionEnd={onSpinEnd}
      >
        <svg viewBox={`${-R - RIM} ${-R - RIM} ${(R + RIM) * 2} ${(R + RIM) * 2}`} role="img" aria-label="Ruleta de premios">
          <circle r={R + RIM} fill="#111" />
          {segments.map((s, i) => {
            const center = (i + 0.5) * seg;
            const fg = textColorFor(s.color);
            const lines = splitLabel(s.label);
            const longest = Math.max(...lines.map((l) => l.length));
            const fs = Math.max(15, Math.min(30, 190 / Math.max(longest, 4)));
            return (
              <g key={s.position}>
                <path d={slicePath(i, n)} fill={s.color} stroke="#111" strokeWidth={1.5} />
                <g transform={`rotate(${center - 90})`}>
                  <text
                    x={R * 0.6}
                    y={0}
                    fill={fg}
                    fontSize={fs}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="lw-label"
                  >
                    {lines.map((l, k) => (
                      <tspan key={k} x={R * 0.6} dy={k === 0 ? (-(lines.length - 1) * fs * 0.55) : fs * 1.1}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                </g>
              </g>
            );
          })}
          {bulbs.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={4.5} fill={i % 2 ? '#F1EDE0' : '#B2AC82'} />
          ))}
          <circle r={46} fill="#111" />
          <circle r={38} fill="none" stroke="#B2AC82" strokeWidth={2} />
          <text y={2} textAnchor="middle" dominantBaseline="middle" fill="#F1EDE0" fontSize={34} className="lw-hub">
            L
          </text>
        </svg>
      </div>
    </div>
  );
}
