import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Chick } from '../components/Chick';
import { sfx } from '../lib/sound';

const STEPS = ['3', '2', '1', '¡A jugar!'];

/** Cuenta regresiva SOLO con el pollito (sin huevos). */
export function Countdown({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < STEPS.length - 1) sfx.count();
    else sfx.go();
    const t = window.setTimeout(() => {
      if (step < STEPS.length - 1) setStep(step + 1);
      else onDone();
    }, step < STEPS.length - 1 ? 900 : 1000);
    return () => window.clearTimeout(t);
  }, [step, onDone]);

  const last = step === STEPS.length - 1;
  return (
    <div className="screen countdown">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={step}
          className={`countdown__num ${last ? 'countdown__num--go' : ''}`}
          initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          {STEPS[step]}
        </motion.div>
      </AnimatePresence>
      <motion.div
        key={`chick-${step}`}
        initial={{ y: 0 }}
        animate={{ y: [0, -46, 0] }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <Chick pose={last ? 'celebrate' : 'idle'} size="min(46vw, 300px)" />
      </motion.div>
    </div>
  );
}
