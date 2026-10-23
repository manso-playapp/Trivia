import type { CSSProperties, ReactNode } from 'react';
import type { GameConfig, PlayRecord } from '../config/types';
import { ConfigContext } from '../lib/configContext';
import { PreviewContext } from '../lib/preview';
import { Attract } from './Attract';
import { Countdown } from './Countdown';
import { Final } from './Final';
import { QuestionScreen } from './QuestionScreen';
import { Ranking } from './Ranking';
import { Register } from './Register';

const noop = () => {};

const sampleRanking: PlayRecord[] = [
  { id: 'r1', device: 'Tablet 1', playedAt: '', name: 'Lucía', email: '', phone: '', consent: false, correct: 5, total: 5, score: 690 },
  { id: 'r2', device: 'Tablet 1', playedAt: '', name: 'Martín', email: '', phone: '', consent: false, correct: 4, total: 5, score: 545 },
  { id: 'r3', device: 'Tablet 1', playedAt: '', name: 'Ana', email: '', phone: '', consent: false, correct: 4, total: 5, score: 520 },
  { id: 'r4', device: 'Tablet 1', playedAt: '', name: '', email: '', phone: '', consent: false, correct: 3, total: 5, score: 410 },
  { id: 'r5', device: 'Tablet 1', playedAt: '', name: 'Jorge', email: '', phone: '', consent: false, correct: 2, total: 5, score: 270 },
];

function Frame({ title, note, config, vars, children }: { title: string; note?: string; config: GameConfig; vars: CSSProperties; children: ReactNode }) {
  return (
    <figure className="scene">
      <div className="scene__viewport">
        <ConfigContext.Provider value={config}>
          <div className="app scene__app" style={vars}>
            <div className="bg-pattern" aria-hidden="true" />
            <div className="screen-wrap">{children}</div>
          </div>
        </ConfigContext.Provider>
      </div>
      <figcaption>
        <b>{title}</b>
        {note && <span>{note}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * Galería de escenas fijas para aprobar el diseño antes de animar.
 * Se abre agregando #escenas al final del enlace.
 */
export function Scenes({ config, vars }: { config: GameConfig; vars: CSSProperties }) {
  const q = config.questions.find((x) => x.active && x.options.length === 3) ?? config.questions[0];
  const wrongPick = (q.correct + 1) % q.options.length;
  const shy: GameConfig = { ...config, settings: { ...config.settings, wrongAnimation: 'timido' } };
  const casi: GameConfig = { ...config, settings: { ...config.settings, wrongAnimation: 'casi' } };
  const f = { config, vars };
  return (
    <PreviewContext.Provider value={true}>
      <div className="scenes">
        <header className="scenes__head">
          <h1>Escenas de la trivia</h1>
          <p>Pantallas fijas para aprobar el diseño. En el juego cada una tiene su animación. Marca y preguntas de {config.theme.brandName}.</p>
        </header>
        <div className="scenes__grid">
          <Frame title="1A. Portada: foto en banda" note="Variante A" {...f}>
            <Attract onStart={noop} onOperator={noop} layout="a" />
          </Frame>
          <Frame title="1B. Portada: pollito en la mano" note="Variante B" {...f}>
            <Attract onStart={noop} onOperator={noop} layout="b" />
          </Frame>
          <Frame title="2. Datos (opcionales)" note="Nombre, mail con sugerencias y teléfono" {...f}>
            <Register onDone={noop} />
          </Frame>
          <Frame title="3. Cuenta 3-2-1" note="Solo el pollito" {...f}>
            <Countdown onDone={noop} />
          </Frame>
          <Frame title="4. Pregunta" note="15 s, 3 opciones" {...f}>
            <QuestionScreen question={q} number={2} total={5} onAnswered={noop} />
          </Frame>
          <Frame title="5. Acierto" note="Pollitos que cruzan + banda que barre" {...f}>
            <QuestionScreen question={q} number={2} total={5} onAnswered={noop} previewPhase="correct" previewPicked={q.correct} />
          </Frame>
          <Frame title="6a. Error: «¡Casi!»" note="Opción por defecto" config={casi} vars={vars}>
            <QuestionScreen question={q} number={2} total={5} onAnswered={noop} previewPhase="wrong" previewPicked={wrongPick} />
          </Frame>
          <Frame title="6b. Error: pollito tímido" note="Alternativa" config={shy} vars={vars}>
            <QuestionScreen question={q} number={2} total={5} onAnswered={noop} previewPhase="wrong" previewPicked={wrongPick} />
          </Frame>
          <Frame title="7. Felicitación (4 o 5 aciertos)" note="Festejo grande" {...f}>
            <Final name="Ana" correct={4} total={5} score={520} onNext={noop} />
          </Frame>
          <Frame title="7b. Felicitación (menos de 4)" note="Festejo suave, siempre felicita" {...f}>
            <Final name="" correct={2} total={5} score={270} onNext={noop} />
          </Frame>
          <Frame title="8. Ranking del día" note="De esta tablet" {...f}>
            <Ranking rows={sampleRanking} currentId="r3" onRestart={noop} />
          </Frame>
        </div>
      </div>
    </PreviewContext.Provider>
  );
}
