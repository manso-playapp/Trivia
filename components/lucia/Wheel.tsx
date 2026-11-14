'use client';

import React from 'react';
import { splitLabel, textColorFor, type PublicSegment } from '@/lib/lucia';

const R = 250; // radio de la cara
const RIM = 26; // aro perlado
const VB = R + RIM + 6;

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
  const studs = Array.from({ length: n }, (_, i) => polar(R + RIM / 2, i * seg));

  return (
    <div className="lw">
      <div
        className="lw-rotor"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: durationMs ? `transform ${durationMs}ms cubic-bezier(0.12, 0.62, 0.08, 1)` : 'none',
        }}
        onTransitionEnd={onSpinEnd}
      >
        <svg viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`} role="img" aria-label="Ruleta de premios">
          <defs>
            <linearGradient id="lw-pearl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.45" stopColor="#E9EAE2" />
              <stop offset="0.7" stopColor="#D3D6C8" />
              <stop offset="1" stopColor="#F7F7F2" />
            </linearGradient>
            <radialGradient id="lw-face-shade" r="0.5">
              <stop offset="0.75" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#3D4836" stopOpacity="0.18" />
            </radialGradient>
          </defs>
          <circle r={R + RIM} fill="url(#lw-pearl)" />
          <circle r={R + RIM - 1} fill="none" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth={2} />
          {segments.map((s, i) => {
            const center = (i + 0.5) * seg;
            const fg = textColorFor(s.color);
            const lines = splitLabel(s.label.toUpperCase(), 10);
            const longest = Math.max(...lines.map((l) => l.length));
            const fs = Math.max(14, Math.min(26, 150 / Math.max(longest, 5)));
            return (
              <g key={s.position}>
                <path d={slicePath(i, n)} fill={s.color} stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth={1.5} />
                <g transform={`rotate(${center - 90})`}>
                  <text x={R * 0.64} y={0} fill={fg} fontSize={fs} textAnchor="middle" dominantBaseline="middle" className="lw-label">
                    {lines.map((l, k) => (
                      <tspan key={k} x={R * 0.64} dy={k === 0 ? -(lines.length - 1) * fs * 0.55 : fs * 1.12}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                </g>
              </g>
            );
          })}
          <circle r={R} fill="url(#lw-face-shade)" pointerEvents="none" />
          <circle r={R} fill="none" stroke="#CDBF98" strokeWidth={2} />
          {studs.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={4} fill="#CDBF98" />
          ))}
        </svg>
      </div>

      {/* Puntero fijo en el centro (no gira) */}
      <svg className="lw-hub" viewBox="-100 -130 200 230" aria-hidden>
        <defs>
          <linearGradient id="lw-knob" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.55" stopColor="#E4E6DC" />
            <stop offset="1" stopColor="#B9BDAE" />
          </linearGradient>
          <filter id="lw-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#3D4836" floodOpacity="0.35" />
          </filter>
        </defs>
        <g filter="url(#lw-shadow)">
          <path d="M0 -122 C 14 -80, 40 -52, 52 -28 A 56 56 0 1 1 -52 -28 C -40 -52, -14 -80, 0 -122 Z" fill="url(#lw-knob)" />
          <circle r={34} fill="#F6F4EC" stroke="#CDBF98" strokeWidth={2} />
        </g>
      </svg>
    </div>
  );
}
