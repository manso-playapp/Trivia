// Ilustraciones: pollitos y huevos (50% blancos / 50% de color).
const EGG_COLORS = ['#ffffff', '#f6b73c', '#ffffff', '#8fd3c8', '#ffffff', '#f4a6b8'];

export function Egg({ size = 36, color = '#fff', face = false }: { size?: number; color?: string; face?: boolean }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" aria-hidden>
      <ellipse cx="20" cy="28" rx="16" ry="20" fill={color} stroke="#00000022" strokeWidth="1.5" />
      {face && (<><circle cx="14" cy="26" r="2" fill="#333" /><circle cx="26" cy="26" r="2" fill="#333" /><path d="M15 34q5 4 10 0" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" /></>)}
    </svg>
  );
}

export function Chick({ size = 80, mood = 'happy' }: { size?: number; mood?: 'happy' | 'sad' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <ellipse cx="50" cy="60" rx="30" ry="28" fill="#ffd23f" />
      <circle cx="50" cy="38" r="22" fill="#ffd23f" />
      <path d="M46 44l4 7 4-7z" fill="#ff8a1f" />
      <circle cx="41" cy="36" r="3.2" fill="#222" /><circle cx="59" cy="36" r="3.2" fill="#222" />
      {mood === 'sad' ? (<>
        <path d="M36 28l9 3M64 28l-9 3" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M60 41q2 6 0 9" stroke="#59b8ff" strokeWidth="3" fill="none" strokeLinecap="round" /></>) : (
        <ellipse cx="34" cy="46" rx="4" ry="2.5" fill="#ff9d7a" opacity=".7" />)}
      <path d="M44 88v6M56 88v6" stroke="#ff8a1f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Fila decorativa de pollitos y huevos alternando blancos / color. */
export function ChicksAndEggs({ count = 6 }: { count?: number }) {
  return (
    <div className="fl-deco" aria-hidden>
      {Array.from({ length: count }).map((_, i) =>
        i % 2 === 0 ? <Chick key={i} size={54} /> : <Egg key={i} size={34} color={EGG_COLORS[i % EGG_COLORS.length]} face={i % 3 === 0} />
      )}
    </div>
  );
}

export function Confetti() {
  const colors = ['#ffd23f', '#fff', '#59b8ff', '#7be495', '#ff8fb1'];
  return (
    <div className="fl-confetti" aria-hidden>
      {Array.from({ length: 40 }).map((_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 10) * 0.12}s`, animationDuration: `${2 + (i % 5) * 0.4}s` }} />
      ))}
    </div>
  );
}
