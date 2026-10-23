import type { CSSProperties } from 'react';
import { useConfig } from '../lib/configContext';

// Huevos de CONSUMO (alimento). Regla de marca: nunca sale nada de un huevo.

export function Egg({ size = 48, style, className = '' }: { size?: number; style?: CSSProperties; className?: string }) {
  const { egg } = useConfig();
  return (
    <svg className={`egg ${className}`} viewBox="0 0 60 76" width={size} height={(size * 76) / 60} style={style} aria-hidden="true">
      <path d="M30 2 C46 2 58 30 58 48 C58 64 46 74 30 74 C14 74 2 64 2 48 C2 30 14 2 30 2 Z" fill={egg.shell} />
      <path d="M58 48 C58 64 46 74 30 74 C40 68 48 58 48 44 C48 32 44 20 40 12 C51 22 58 36 58 48 Z" fill={egg.shellShade} opacity="0.7" />
      <ellipse cx="20" cy="26" rx="5" ry="9" transform="rotate(20 20 26)" fill="#fff" opacity="0.7" />
    </svg>
  );
}

/** Huevo roto en el piso: cáscara partida + clara + yema. */
export function BrokenEgg({ size = 180, style }: { size?: number; style?: CSSProperties }) {
  const { egg } = useConfig();
  return (
    <svg className="broken-egg" viewBox="0 0 180 110" width={size} height={(size * 110) / 180} style={style} aria-hidden="true">
      <path
        className="broken-egg__white"
        d="M20 82 C8 70 22 56 40 60 C46 44 70 42 82 54 C96 40 124 44 128 60 C146 52 170 62 162 78 C176 88 160 104 140 98 C126 108 100 106 90 100 C74 108 48 106 40 98 C22 102 8 94 20 82 Z"
        fill={egg.white}
      />
      <ellipse className="broken-egg__yolk" cx="92" cy="78" rx="22" ry="18" fill={egg.yolk} />
      <ellipse cx="85" cy="72" rx="6" ry="4" fill="#fff" opacity="0.6" />
      <path className="broken-egg__shell broken-egg__shell--l" d="M18 70 L24 46 L32 54 L38 40 L46 52 L50 72 C40 78 26 78 18 70 Z" fill={egg.shell} stroke={egg.shellShade} strokeWidth="2" />
      <path className="broken-egg__shell broken-egg__shell--r" d="M132 74 L136 50 L144 58 L150 44 L158 56 L164 72 C154 80 140 80 132 74 Z" fill={egg.shell} stroke={egg.shellShade} strokeWidth="2" />
    </svg>
  );
}
