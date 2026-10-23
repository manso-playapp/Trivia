import { motion } from 'framer-motion';
import { BrandBadge } from '../components/Brand';
import { Chick } from '../components/Chick';
import { Egg } from '../components/Egg';
import { useConfig } from '../lib/configContext';

export function Attract({ onStart, onOperator }: { onStart: () => void; onOperator: () => void }) {
  const { texts } = useConfig();
  return (
    <div className="screen attract" onClick={onStart}>
      <div onClick={(e) => e.stopPropagation()}>
        <BrandBadge onLongPress={onOperator} size={120} />
      </div>
      <motion.h1
        className="attract__title"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        {texts.attractTitle}
      </motion.h1>
      <div className="attract__stage">
        <div className="attract__egg attract__egg--a">
          <Egg size={70} />
        </div>
        <Chick pose="idle" size="min(58vw, 380px)" />
        <div className="attract__egg attract__egg--b">
          <Egg size={56} />
        </div>
      </div>
      <motion.div
        className="attract__cta"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {texts.attractCta}
      </motion.div>
    </div>
  );
}
