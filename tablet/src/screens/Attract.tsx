import { motion } from 'framer-motion';
import { BrandBadge } from '../components/Brand';
import { Chick } from '../components/Chick';
import { useConfig } from '../lib/configContext';

/**
 * Portada. Jerarquía: 1) foto héroe, 2) título medio, 3) un solo llamado a la acción
 * abajo (zona del pulgar), 4) logo como firma discreta.
 */
export function Attract({ onStart, onOperator, layout }: { onStart: () => void; onOperator: () => void; layout?: 'a' | 'b' }) {
  const { texts, theme } = useConfig();
  const variant = layout ?? theme.attractLayout;
  const hero = variant === 'b' ? theme.heroAlt || theme.hero : theme.hero;

  const logo = (
    <div className="attract__sign" onClick={(e) => e.stopPropagation()}>
      <BrandBadge onLongPress={onOperator} size={70} light={variant === 'b'} />
    </div>
  );
  const cta = (
    <div className="attract__cta-zone">
      <motion.div
        className="attract__cta"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="attract__ripple" aria-hidden="true" />
        {texts.attractCta}
      </motion.div>
    </div>
  );
  const titles = (
    <div className="attract__titles">
      <h1 className="attract__title">{texts.attractTitle}</h1>
      {theme.attractSubtitle && <p className="attract__subtitle">{theme.attractSubtitle}</p>}
    </div>
  );

  return (
    <div className={`screen attract attract--${variant}`} onClick={onStart}>
      <div className="attract__hero-zone">
        {variant === 'a' && <div className="attract__panel" aria-hidden="true" />}
        {hero ? (
          <motion.img
            className="attract__hero"
            src={hero}
            alt=""
            draggable={false}
            initial={{ scale: 1.04, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ) : (
          <Chick pose="idle" size="min(58cqw, 380px)" />
        )}
        {logo}
      </div>
      {titles}
      {cta}
    </div>
  );
}
