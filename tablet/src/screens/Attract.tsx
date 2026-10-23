import { motion } from 'framer-motion';
import { Band, BrandBadge } from '../components/Brand';
import { Chick } from '../components/Chick';
import { useConfig } from '../lib/configContext';

export function Attract({ onStart, onOperator }: { onStart: () => void; onOperator: () => void }) {
  const { texts, theme } = useConfig();
  return (
    <div className="screen attract" onClick={onStart}>
      <div onClick={(e) => e.stopPropagation()}>
        <BrandBadge onLongPress={onOperator} size={150} />
      </div>
      <motion.h1
        className="attract__title"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        {texts.attractTitle}
      </motion.h1>
      {/* El slogan va en la banda solo si el logo no lo trae */}
      {theme.slogan && !theme.logoOnBrand && <Band>{theme.slogan}</Band>}
      <motion.div
        className="attract__cta"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {texts.attractCta}
      </motion.div>
      <div className="attract__stage">
        {theme.hero ? (
          <img className="attract__hero" src={theme.hero} alt="" draggable={false} />
        ) : (
          <Chick pose="idle" size="min(58cqw, 380px)" />
        )}
      </div>
    </div>
  );
}
