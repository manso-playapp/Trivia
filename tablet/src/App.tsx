import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameConfig, PlayRecord, Question } from './config/types';
import { ConfigContext } from './lib/configContext';
import { dailyRanking, pickQuestions } from './lib/game';
import { setSoundEnabled } from './lib/sound';
import { addPlay, loadConfig, loadPlays, resetConfig, saveConfig, savePlays } from './lib/storage';
import { Attract } from './screens/Attract';
import { Countdown } from './screens/Countdown';
import { Final } from './screens/Final';
import { Operator } from './screens/Operator';
import { QuestionScreen, type Answer } from './screens/QuestionScreen';
import { Ranking } from './screens/Ranking';
import { anonymousPlayer, Register, type Player } from './screens/Register';

type Screen = 'attract' | 'register' | 'countdown' | 'question' | 'final' | 'ranking';

function themeVars(c: GameConfig): CSSProperties {
  const t = c.theme;
  return {
    '--brand': t.brand,
    '--on-brand': t.onBrand,
    '--bg': t.background,
    '--pattern': t.pattern,
    '--surface': t.surface,
    '--text': t.text,
    '--muted': t.muted,
    '--ok': t.correct,
    '--bad': t.wrong,
    '--font-heading': `'${t.headingFont}', system-ui, sans-serif`,
    '--font-body': `'${t.bodyFont}', system-ui, sans-serif`,
  } as CSSProperties;
}

export default function App() {
  const [config, setConfig] = useState<GameConfig>(loadConfig);
  const [plays, setPlays] = useState<PlayRecord[]>(loadPlays);
  const [screen, setScreen] = useState<Screen>('attract');
  const [operator, setOperator] = useState(false);
  const [player, setPlayer] = useState<Player>(anonymousPlayer);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [lastPlayId, setLastPlayId] = useState<string | null>(null);
  const lastTouch = useRef(Date.now());

  useEffect(() => setSoundEnabled(config.settings.sound), [config.settings.sound]);

  const goHome = useCallback(() => {
    setScreen('attract');
    setPlayer(anonymousPlayer);
    setAnswers([]);
    setQuestions([]);
  }, []);

  // Reinicio automático: sin tocar la pantalla durante N segundos, vuelve al inicio.
  useEffect(() => {
    lastTouch.current = Date.now();
  }, [screen]);
  useEffect(() => {
    const touch = () => (lastTouch.current = Date.now());
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    const id = window.setInterval(() => {
      if (operator || screen === 'attract' || screen === 'countdown') return;
      if (Date.now() - lastTouch.current > config.settings.idleResetSeconds * 1000) goHome();
    }, 1000);
    return () => {
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
      window.clearInterval(id);
    };
  }, [screen, operator, config.settings.idleResetSeconds, goHome]);

  const startGame = (p: Player) => {
    const qs = pickQuestions(config.questions, config.settings.questionsPerGame);
    if (qs.length === 0) {
      alert('No hay preguntas activas. Cargalas desde el menú del operador.');
      return;
    }
    setPlayer(p);
    setQuestions(qs);
    setAnswers([]);
    setScreen('countdown');
  };

  const onAnswered = useCallback(
    (a: Answer) => {
      const next = [...answers, a];
      setAnswers(next);
      if (next.length < questions.length) return;
      const record: PlayRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        device: config.settings.deviceName,
        playedAt: new Date().toISOString(),
        name: player.name,
        email: player.email,
        phone: player.phone,
        consent: player.consent,
        correct: next.filter((x) => x.correct).length,
        total: next.length,
        score: next.reduce((s, x) => s + x.score, 0),
      };
      setPlays(addPlay(record));
      setLastPlayId(record.id);
      setScreen('final');
    },
    [answers, questions.length, config.settings.deviceName, player],
  );

  const onCountdownDone = useCallback(() => setScreen('question'), []);
  const onFinalDone = useCallback(() => setScreen('ranking'), []);

  const ranking = useMemo(() => dailyRanking(plays), [plays]);
  const current = questions[answers.length];
  const correctCount = answers.filter((a) => a.correct).length;
  const score = answers.reduce((s, a) => s + a.score, 0);

  let view: JSX.Element | null = null;
  if (screen === 'attract') view = <Attract onStart={() => setScreen('register')} onOperator={() => setOperator(true)} />;
  else if (screen === 'register') view = <Register onDone={startGame} />;
  else if (screen === 'countdown') view = <Countdown onDone={onCountdownDone} />;
  else if (screen === 'question' && current)
    view = <QuestionScreen key={current.id} question={current} number={answers.length + 1} total={questions.length} onAnswered={onAnswered} />;
  else if (screen === 'final')
    view = <Final name={player.name} correct={correctCount} total={questions.length} score={score} onNext={onFinalDone} />;
  else if (screen === 'ranking') view = <Ranking rows={ranking} currentId={lastPlayId} onRestart={goHome} />;

  return (
    <ConfigContext.Provider value={config}>
      <div className="app" style={themeVars(config)}>
        <div className="bg-pattern" aria-hidden="true" />
        <AnimatePresence mode="wait">
          <motion.div
            key={screen === 'question' ? `q-${answers.length}` : screen}
            className="screen-wrap"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.28 }}
          >
            {view}
          </motion.div>
        </AnimatePresence>
        {operator && (
          <Operator
            config={config}
            plays={plays}
            onSaveConfig={(c) => {
              setConfig(c);
              saveConfig(c);
            }}
            onSavePlays={(p) => {
              setPlays(p);
              savePlays(p);
            }}
            onResetConfig={() => {
              resetConfig();
              setConfig(loadConfig());
            }}
            onClose={() => setOperator(false)}
          />
        )}
      </div>
    </ConfigContext.Provider>
  );
}
