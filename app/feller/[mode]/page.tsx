"use client";
import { useEffect, useRef, useState } from 'react';
import { notFound } from 'next/navigation';
import '../feller.css';
import { FELLER_QUESTIONS, QUESTION_SECONDS } from '@/data/feller';
import { FRASE, MODES, hasWon, isFellerMode } from '@/lib/feller';
import { Chick, ChicksAndEggs, Confetti, Egg } from '@/components/feller/Art';

type Step = 'cover' | 'form' | 'question' | 'feedback' | 'final';

export default function FellerPage({ params }: { params: { mode: string } }) {
  if (!isFellerMode(params.mode)) notFound();
  const mode = params.mode;
  const cfg = MODES[mode];
  const questions = FELLER_QUESTIONS.slice(0, cfg.total);

  const [step, setStep] = useState<Step>('cover');
  const [nombre, setNombre] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); // null = tiempo agotado
  const [correct, setCorrect] = useState(0);
  const [left, setLeft] = useState(QUESTION_SECONDS);
  const answered = useRef(false);
  const q = questions[i];

  useEffect(() => {
    if (step !== 'question') return;
    answered.current = false;
    setLeft(QUESTION_SECONDS);
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { clearInterval(id); if (!answered.current) answer(null); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, i]);

  function answer(idx: number | null) {
    if (answered.current) return;
    answered.current = true;
    setPicked(idx);
    if (idx === q.correct) setCorrect((c) => c + 1);
    setStep('feedback');
  }

  function next() {
    if (i + 1 >= questions.length) {
      const total = correct;
      try {
        const log = JSON.parse(localStorage.getItem('feller-results') || '[]');
        log.push({ nombre, localidad, mode, correct: total, at: new Date().toISOString() });
        localStorage.setItem('feller-results', JSON.stringify(log));
      } catch {}
      setStep('final');
    } else { setI(i + 1); setPicked(null); setStep('question'); }
  }

  function restart() { setNombre(''); setLocalidad(''); setI(0); setCorrect(0); setPicked(null); setStep('cover'); }

  const isRight = picked === q?.correct;
  const won = hasWon(mode, correct);

  return (
    <main className="fl">
      <div className="fl-screen">
        <img className="fl-logo" src="/feller/logo.svg" alt="Feller" />

        {step === 'cover' && (<>
          <h1 className="fl-title">¿Cuánto sabés del huevo?</h1>
          {/* Foto de portada (persona sosteniendo un huevo): colocar en public/feller/portada.jpg */}
          <div className="fl-cover-photo" style={{ backgroundImage: 'url(/feller/portada.jpg)' }}>
            <ChicksAndEggs count={5} />
          </div>
          <button className="fl-btn" onClick={() => setStep('form')}>¡Jugá ahora!</button>
        </>)}

        {step === 'form' && (
          <form className="fl-card" onSubmit={(e) => { e.preventDefault(); setStep('question'); }}>
            <div className="fl-label">PARA COMPLETAR</div>
            <label className="fl-label">Nombre
              <input className="fl-input" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={60} autoComplete="off" />
            </label>
            <label className="fl-label">Localidad
              <input className="fl-input" value={localidad} onChange={(e) => setLocalidad(e.target.value)} required maxLength={60} autoComplete="off" />
            </label>
            <button className="fl-btn" style={{ background: '#e8323a', color: '#fff' }} type="submit">Comenzar</button>
          </form>
        )}

        {step === 'question' && (<>
          <div className="fl-meta"><span>Pregunta {i + 1} de {questions.length}</span><span>{left}s</span></div>
          <div className="fl-bar"><div style={{ width: `${(left / QUESTION_SECONDS) * 100}%` }} /></div>
          <div className="fl-q">
            {q.visual && <div className="fl-q-visual">{q.visual}</div>}
            <h2 className="fl-q-text">{q.text}</h2>
          </div>
          {q.options.map((o, k) => (
            <button key={k} className="fl-opt" onClick={() => answer(k)}>{o}</button>
          ))}
          <ChicksAndEggs count={6} />
        </>)}

        {step === 'feedback' && (<>
          <div className="fl-meta"><span>Pregunta {i + 1} de {questions.length}</span><span>{correct} correctas</span></div>
          <div className="fl-q"><h2 className="fl-q-text">{q.text}</h2></div>
          {q.options.map((o, k) => (
            <div key={k} className={`fl-opt ${k === q.correct ? 'ok' : k === picked ? 'bad' : ''}`}>{o}</div>
          ))}
          <div className="fl-feedback">
            {isRight ? (<>
              <Confetti />
              <div className="fl-ok"><span className="fl-jump"><Chick size={130} /></span>¡Correcto!</div>
            </>) : (<>
              <div className="fl-eggfall"><Egg size={90} color="#fff" face /></div>
              <div className="fl-splat">🍳</div>
              <div className="fl-bad"><span className="fl-sad"><Chick size={130} mood="sad" /></span>¡Casi!</div>
              <div className="fl-explain">{picked === null ? 'Se acabó el tiempo. ' : ''}La respuesta correcta es <b>{q.options[q.correct]}</b>. {q.explanation}</div>
            </>)}
          </div>
          <button className="fl-btn fl-next" onClick={next}>{i + 1 >= questions.length ? 'Ver resultado' : 'Siguiente'}</button>
        </>)}

        {step === 'final' && (<div className="fl-final fl-screen" style={{ padding: 0, minHeight: 0 }}>
          {won && <Confetti />}
          {won ? (<>
            <h1>¡GANASTE!</h1>
            <p>Te llevás un premio</p>
            <ChicksAndEggs count={7} />
          </>) : (<>
            <h1>{correct}/{questions.length}</h1>
            <p>respuestas correctas</p>
            <p><b>¡Gracias por jugar!</b></p>
          </>)}
          <div className="fl-frase">{FRASE.map((l) => <div key={l}>{l}</div>)}</div>
          <img className="fl-logo" src="/feller/logo.svg" alt="Feller" />
          <button className="fl-btn" onClick={restart}>Nuevo jugador</button>
        </div>)}
      </div>
    </main>
  );
}
