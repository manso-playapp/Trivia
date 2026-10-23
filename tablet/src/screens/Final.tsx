import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { BrandBadge } from '../components/Brand';
import { Chick } from '../components/Chick';
import { BandSweep, ChickParade, Confetti } from '../components/Effects';
import { useConfig } from '../lib/configContext';
import { useFrozen } from '../lib/preview';
import { sfx } from '../lib/sound';

/**
 * Cierre: SIEMPRE felicita. Nunca "perdiste", ni premios ni ganadores.
 * Solo cambia la intensidad del festejo según los aciertos.
 */
export function Final({
  name,
  correct,
  total,
  score,
  onNext,
}: {
  name: string;
  correct: number;
  total: number;
  score: number;
  onNext: () => void;
}) {
  const { texts, settings } = useConfig();
  const big = correct >= settings.bigCelebrationAt;
  const frozen = useFrozen();

  useEffect(() => {
    if (frozen) return;
    sfx.celebrate();
    const t = window.setTimeout(onNext, big ? 8000 : 7000);
    return () => window.clearTimeout(t);
  }, [big, onNext, frozen]);

  return (
    <div className="screen final" onClick={onNext}>
      <BrandBadge size={64} />
      <motion.h1
        className="final__title"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 12 }}
      >
        {texts.congrats}
        {name ? `, ${name}` : ''}!
      </motion.h1>
      <motion.div
        className="score-ring"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 160, damping: 12 }}
      >
        <CountUp to={score} />
        <span className="score-ring__label">puntos</span>
      </motion.div>
      <p className="final__hits">
        {correct} de {total} respuestas correctas
      </p>
      {!big && <p className="final__thanks">{texts.thanks}</p>}
      <Chick pose="celebrate" size={big ? 'min(40cqw, 240px)' : 'min(32cqw, 190px)'} />
      <span className="final__tap">Tocá para ver el ranking</span>
      {big ? (
        <>
          <BandSweep />
          <ChickParade count={6} size={84} />
          <Confetti count={44} />
        </>
      ) : (
        <Confetti count={16} seed={5} />
      )}
    </div>
  );
}

function CountUp({ to }: { to: number }) {
  return (
    <motion.span className="score-ring__num" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Counter to={to} />
    </motion.span>
  );
}


function Counter({ to }: { to: number }) {
  const v = useMotionValue(0);
  const rounded = useTransform(v, (x) => Math.round(x).toString());
  useEffect(() => {
    const c = animate(v, to, { duration: 1.2, delay: 0.5, ease: 'easeOut' });
    return () => c.stop();
  }, [to, v]);
  return <motion.span>{rounded}</motion.span>;
}
