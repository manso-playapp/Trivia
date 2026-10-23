import { motion } from 'framer-motion';
import { BrandBadge } from '../components/Brand';
import { Chick } from '../components/Chick';
import type { PlayRecord } from '../config/types';

export function Ranking({ rows, currentId, onRestart }: { rows: PlayRecord[]; currentId: string | null; onRestart: () => void }) {
  return (
    <div className="screen ranking">
      <BrandBadge size={64} />
      <div className="card ranking__card">
        <h2 className="card__title">Ranking del día</h2>
        {rows.length === 0 && <p className="register__hint">Todavía no hay partidas hoy.</p>}
        <ol className="ranking__list">
          {rows.map((r, i) => (
            <motion.li
              key={r.id}
              className={`ranking__row ${r.id === currentId ? 'is-me' : ''}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i, type: 'spring', stiffness: 200, damping: 20 }}
            >
              <span className="ranking__pos">{i + 1}</span>
              <span className="ranking__name">{r.name || 'Jugador/a'}</span>
              <span className="ranking__score">{r.score}</span>
            </motion.li>
          ))}
        </ol>
      </div>
      <button type="button" className="btn btn--primary btn--big" onClick={onRestart}>
        Jugar de nuevo
      </button>
      <div className="ranking__chick">
        <Chick pose="peck" size={110} />
      </div>
    </div>
  );
}
