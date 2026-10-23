import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Band, BrandBadge } from '../components/Brand';
import { Chick } from '../components/Chick';
import { BandSweep, ChickParade } from '../components/Effects';
import type { Question } from '../config/types';
import { useConfig } from '../lib/configContext';
import { scoreFor } from '../lib/game';
import { useFrozen } from '../lib/preview';
import { sfx } from '../lib/sound';

export interface Answer {
  questionId: string;
  correct: boolean;
  score: number;
}

export type Phase = 'asking' | 'correct' | 'wrong' | 'timeout';

const LETTERS = ['A', 'B', 'C', 'D'];

export function QuestionScreen({
  question,
  number,
  total,
  onAnswered,
  previewPhase,
  previewPicked = null,
}: {
  question: Question;
  number: number;
  total: number;
  onAnswered: (a: Answer) => void;
  /** solo para la galería de escenas */
  previewPhase?: Phase;
  previewPicked?: number | null;
}) {
  const { settings } = useConfig();
  const frozen = useFrozen();
  const seconds = settings.secondsPerQuestion;
  const [phase, setPhase] = useState<Phase>(previewPhase ?? 'asking');
  const [picked, setPicked] = useState<number | null>(previewPicked);
  const [left, setLeft] = useState(frozen ? seconds * 0.6 : seconds);
  const startedAt = useRef(performance.now());
  const answer = useRef<Answer | null>(null);

  // Reloj: se calcula desde la hora de inicio (no se atrasa si la tablet se pone lenta).
  useEffect(() => {
    if (phase !== 'asking' || frozen) return;
    let lastWhole = seconds;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, seconds - (performance.now() - startedAt.current) / 1000);
      setLeft(remaining);
      const whole = Math.ceil(remaining);
      if (whole !== lastWhole) {
        lastWhole = whole;
        if (whole <= 5 && whole > 0) sfx.tick();
      }
      if (remaining <= 0) {
        window.clearInterval(id);
        answer.current = { questionId: question.id, correct: false, score: 0 };
        sfx.wrong();
        setPhase('timeout');
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, seconds, question.id, frozen]);

  // Después de mostrar la devolución, pasa a la siguiente.
  useEffect(() => {
    if (phase === 'asking' || frozen) return;
    const t = window.setTimeout(() => answer.current && onAnswered(answer.current), 2300);
    return () => window.clearTimeout(t);
  }, [phase, onAnswered, frozen]);

  const choose = (i: number) => {
    if (phase !== 'asking' || frozen) return;
    const remaining = Math.max(0, seconds - (performance.now() - startedAt.current) / 1000);
    const ok = i === question.correct;
    answer.current = { questionId: question.id, correct: ok, score: scoreFor(ok, remaining, seconds) };
    setPicked(i);
    if (ok) sfx.correct();
    else sfx.wrong();
    setPhase(ok ? 'correct' : 'wrong');
  };

  const urgent = phase === 'asking' && left <= 5;
  return (
    <div className="screen question">
      <div className="question__top">
        <BrandBadge size={96} />
        <div className="progress">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`progress__dot ${i < number - 1 ? 'is-done' : ''} ${i === number - 1 ? 'is-current' : ''}`} />
          ))}
        </div>
      </div>

      <motion.div
        className="card question__card"
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        animate={phase === 'wrong' ? { x: [0, -10, 10, -6, 6, 0], y: 0, opacity: 1, scale: 1 } : { y: 0, opacity: 1, scale: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      >
        <div className="question__header">
          <span className="question__count">
            Pregunta {number} de {total}
          </span>
          <h2 className="question__text">{question.text}</h2>
        </div>
        <div className="timer">
          <div className={`timer__bar ${urgent ? 'is-urgent' : ''}`} style={{ transform: `scaleX(${left / seconds})` }} />
          <span className={`timer__num ${urgent ? 'is-urgent' : ''}`}>{Math.ceil(left)}</span>
        </div>
        <div className="options">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.correct;
            let state = '';
            if (phase !== 'asking') {
              if (isCorrect) state = 'is-correct';
              else if (i === picked) state = 'is-wrong';
              else state = 'is-dim';
            }
            return (
              <motion.button
                key={i}
                type="button"
                className={`option ${state}`}
                onClick={() => choose(i)}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0, scale: phase === 'correct' && isCorrect ? [1, 1.06, 1] : 1 }}
                transition={{ delay: phase === 'asking' ? 0.15 + i * 0.1 : 0, type: 'spring', stiffness: 220, damping: 20 }}
                whileTap={phase === 'asking' ? { scale: 0.96 } : undefined}
              >
                <span className="option__letter">{isCorrect && phase !== 'asking' ? '✓' : LETTERS[i]}</span>
                <span className="option__text">{opt}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <div className="question__feedback">
        {phase === 'asking' && <Chick pose="idle" size={120} />}
        {phase === 'correct' && (
          <motion.div className="feedback feedback--ok" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
            <span className="feedback__mark">✓</span>
            <span>¡Correcto!</span>
          </motion.div>
        )}
        {phase === 'wrong' && (settings.wrongAnimation === 'timido' ? <WrongShy /> : <WrongCasi />)}
        {phase === 'timeout' && (
          <motion.div className="feedback feedback--timeout" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Chick pose="surprised" size={120} />
            <Band>¡Se acabó el tiempo!</Band>
          </motion.div>
        )}
      </div>

      {phase === 'correct' && (
        <>
          <BandSweep />
          <ChickParade count={5} size={92} />
        </>
      )}
    </div>
  );
}

/** Error, opción A (por defecto): el pollito inclina la cabeza sorprendido y aparece "¡Casi!" sobre la banda. */
function WrongCasi() {
  return (
    <motion.div className="feedback feedback--wrong" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 15 }}>
      <Chick pose="surprised" size={130} />
      <Band>¡Casi!</Band>
    </motion.div>
  );
}

/** Error, opción B: el pollito se asoma tímido desde abajo y vuelve a esconderse. */
function WrongShy() {
  return (
    <div className="feedback feedback--shy">
      <Band>¡Uy! Era la otra</Band>
      <div className="shy-chick">
        <Chick pose="wave" size={150} />
      </div>
    </div>
  );
}
