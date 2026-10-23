import { useRef, useState, type ReactNode } from 'react';
import { Chick } from '../components/Chick';
import type { ChickStyle, GameConfig, PlayRecord, Settings, Texts, Theme, WrongAnimation } from '../config/types';
import { ConfigContext } from '../lib/configContext';
import { playsToCsv } from '../lib/csv';
import { imageToDataUrl, saveTextFile } from '../lib/files';
import { dailyRanking } from '../lib/game';
import { QUESTIONS_TEMPLATE, questionsFromCsv } from '../lib/questionsCsv';
import { mergeConfig } from '../lib/storage';

type Tab = 'partidas' | 'preguntas' | 'marca' | 'pollito' | 'ajustes';
const TABS: { id: Tab; label: string }[] = [
  { id: 'partidas', label: 'Partidas' },
  { id: 'preguntas', label: 'Preguntas' },
  { id: 'marca', label: 'Marca' },
  { id: 'pollito', label: 'Pollito' },
  { id: 'ajustes', label: 'Ajustes' },
];

interface Props {
  config: GameConfig;
  plays: PlayRecord[];
  onSaveConfig: (c: GameConfig) => void;
  onSavePlays: (p: PlayRecord[]) => void;
  onResetConfig: () => void;
  onClose: () => void;
}

/** Menú oculto del operador: se abre manteniendo apretado el logo 3 s + PIN. */
export function Operator(props: Props) {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PinPad pin={props.config.settings.operatorPin} onOk={() => setUnlocked(true)} onClose={props.onClose} />;
  return <Panel {...props} />;
}

function PinPad({ pin, onOk, onClose }: { pin: string; onOk: () => void; onClose: () => void }) {
  const [value, setValue] = useState('');
  const press = (d: string) => {
    const next = (value + d).slice(0, 8);
    setValue(next);
    if (next === pin) onOk();
  };
  return (
    <div className="operator">
      <div className="card operator__card">
        <h2 className="card__title">Operador</h2>
        <div className="pin">{value.replace(/./g, '•') || 'Ingresá el PIN'}</div>
        <div className="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button type="button" onClick={() => setValue('')}>
            Borrar
          </button>
          <button type="button" onClick={() => press('0')}>
            0
          </button>
          <button type="button" onClick={onClose}>
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}

/** Botón que pide un segundo toque para confirmar (los diálogos del sistema no siempre aparecen). */
function ConfirmButton({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  return armed ? (
    <span className="op-row">
      <button type="button" className="btn btn--danger" onClick={() => (setArmed(false), onConfirm())}>
        {confirmLabel}
      </button>
      <button type="button" className="btn btn--ghost" onClick={() => setArmed(false)}>
        Cancelar
      </button>
    </span>
  ) : (
    <button type="button" className="btn btn--ghost" onClick={() => setArmed(true)}>
      {label}
    </button>
  );
}

function Panel({ config, plays, onSaveConfig, onSavePlays, onResetConfig, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('partidas');
  const [msg, setMsg] = useState('');
  const say = (m: string) => setMsg(m);
  const stamp = new Date().toISOString().slice(0, 10);

  const setTheme = (p: Partial<Theme>) => onSaveConfig({ ...config, theme: { ...config.theme, ...p } });
  const setChick = (p: Partial<ChickStyle>) => onSaveConfig({ ...config, chick: { ...config.chick, ...p } });
  const setTexts = (p: Partial<Texts>) => onSaveConfig({ ...config, texts: { ...config.texts, ...p } });
  const setSettings = (p: Partial<Settings>) => onSaveConfig({ ...config, settings: { ...config.settings, ...p } });

  const save = async (name: string, text: string, mime?: string) => {
    try {
      say(await saveTextFile(name, text, mime));
    } catch {
      say('No se pudo guardar el archivo.');
    }
  };

  let body: ReactNode = null;
  if (tab === 'partidas') {
    const today = dailyRanking(plays, new Date(), Number.MAX_SAFE_INTEGER);
    const device = config.settings.deviceName.replace(/\s+/g, '-').toLowerCase();
    body = (
      <>
        <p>
          Hoy: <b>{today.length}</b> partidas · Guardadas en total: <b>{plays.length}</b> · Con permiso de contacto: <b>{plays.filter((p) => p.consent).length}</b>
        </p>
        <div className="op-row">
          <button type="button" className="btn btn--primary" onClick={() => save(`partidas-${device}-${stamp}.csv`, playsToCsv(plays))}>
            Descargar planilla (CSV)
          </button>
          <ConfirmButton
            label="Borrar partidas de hoy"
            confirmLabel="Sí, borrar las de hoy"
            onConfirm={() => {
              onSavePlays(plays.filter((p) => !today.some((t) => t.id === p.id)));
              say('Partidas de hoy borradas.');
            }}
          />
        </div>
        <p className="op-note">Descargá la planilla antes de borrar. Cada tablet guarda sus propias partidas; después se unen las planillas.</p>
      </>
    );
  } else if (tab === 'preguntas') {
    body = <QuestionsTab config={config} onSaveConfig={onSaveConfig} say={say} onTemplate={() => save('plantilla-preguntas.csv', QUESTIONS_TEMPLATE)} />;
  } else if (tab === 'marca') {
    body = (
      <>
        <div className="op-grid">
          <ColorField label="Color principal" value={config.theme.brand} onChange={(v) => setTheme({ brand: v })} />
          <ColorField label="Fondo" value={config.theme.background} onChange={(v) => setTheme({ background: v })} />
          <ColorField label="Trama del fondo" value={config.theme.pattern} onChange={(v) => setTheme({ pattern: v })} />
          <ColorField label="Texto sobre el color principal" value={config.theme.onBrand} onChange={(v) => setTheme({ onBrand: v })} />
          <ColorField label="Respuesta correcta" value={config.theme.correct} onChange={(v) => setTheme({ correct: v })} />
          <ColorField label="Respuesta elegida incorrecta" value={config.theme.wrong} onChange={(v) => setTheme({ wrong: v })} />
        </div>
        <ImageField label="Logo para fondo blanco (PNG transparente o SVG)" value={config.theme.logo} onChange={(logo) => setTheme({ logo })} say={say} />
        <ImageField label="Logo en blanco, para el fondo de color (opcional)" value={config.theme.logoOnBrand} onChange={(logoOnBrand) => setTheme({ logoOnBrand })} say={say} dark />
        <ImageField label="Foto de la pantalla de espera (opcional, fondo recortado)" value={config.theme.hero} onChange={(hero) => setTheme({ hero })} say={say} dark maxSide={1200} />
        <TextField label="Slogan (aparece en una banda)" value={config.theme.slogan} onChange={(v) => setTheme({ slogan: v })} />
        <label className="field">
          <span>Diseño de la portada</span>
          <select value={config.theme.attractLayout} onChange={(e) => setTheme({ attractLayout: e.target.value as 'a' | 'b' })}>
            <option value="a">A: foto grande en banda inclinada</option>
            <option value="b">B: foto sobre blanco y franja roja abajo</option>
          </select>
        </label>
        <ImageField label="Foto de la portada B (opcional)" value={config.theme.heroAlt} onChange={(heroAlt) => setTheme({ heroAlt })} say={say} maxSide={1200} />
        <TextField label="Línea bajo el título de la portada" value={config.theme.attractSubtitle} onChange={(v) => setTheme({ attractSubtitle: v })} />
        <TextField label="Nombre de la marca (si no hay logo)" value={config.theme.brandName} onChange={(v) => setTheme({ brandName: v })} />
        <TextField label="Título de la pantalla de espera" value={config.texts.attractTitle} onChange={(v) => setTexts({ attractTitle: v })} />
        <TextField label="Botón de la pantalla de espera" value={config.texts.attractCta} onChange={(v) => setTexts({ attractCta: v })} />
        <TextField label="Título del formulario" value={config.texts.registerTitle} onChange={(v) => setTexts({ registerTitle: v })} />
        <TextField label="Casilla de permiso" value={config.texts.consent} onChange={(v) => setTexts({ consent: v })} />
        <TextField label="Aviso de privacidad" value={config.texts.privacy} onChange={(v) => setTexts({ privacy: v })} multiline />
        <TextField label="Felicitación (se agrega el nombre)" value={config.texts.congrats} onChange={(v) => setTexts({ congrats: v })} />
        <TextField label="Mensaje final" value={config.texts.thanks} onChange={(v) => setTexts({ thanks: v })} />
      </>
    );
  } else if (tab === 'pollito') {
    body = (
      <div className="op-chick">
        <ConfigContext.Provider value={config}>
          <div className="op-chick__preview" style={{ background: config.theme.background }}>
            <Chick pose="idle" size={150} />
            <Chick pose="hop" size={110} />
            <Chick pose="surprised" size={110} />
          </div>
        </ConfigContext.Provider>
        <div className="op-grid">
          <ColorField label="Cuerpo" value={config.chick.body} onChange={(v) => setChick({ body: v })} />
          <ColorField label="Alas y sombra" value={config.chick.bodyShade} onChange={(v) => setChick({ bodyShade: v })} />
          <ColorField label="Pico" value={config.chick.beak} onChange={(v) => setChick({ beak: v })} />
          <ColorField label="Patas" value={config.chick.legs} onChange={(v) => setChick({ legs: v })} />
          <ColorField label="Mejillas" value={config.chick.cheek} onChange={(v) => setChick({ cheek: v })} />
          <ColorField label="Ojos" value={config.chick.eye} onChange={(v) => setChick({ eye: v })} />
        </div>
        <RangeField label="Tamaño de la cabeza" value={config.chick.headScale} min={0.8} max={1.2} onChange={(v) => setChick({ headScale: v })} />
        <RangeField label="Tamaño de los ojos" value={config.chick.eyeScale} min={0.7} max={1.4} onChange={(v) => setChick({ eyeScale: v })} />
      </div>
    );
  } else if (tab === 'ajustes') {
    body = (
      <>
        <TextField label="Nombre de esta tablet (aparece en la planilla)" value={config.settings.deviceName} onChange={(v) => setSettings({ deviceName: v })} />
        <div className="op-grid">
          <NumberField label="Preguntas por partida" value={config.settings.questionsPerGame} min={1} max={20} onChange={(v) => setSettings({ questionsPerGame: v })} />
          <NumberField label="Segundos por pregunta" value={config.settings.secondsPerQuestion} min={5} max={60} onChange={(v) => setSettings({ secondsPerQuestion: v })} />
          <NumberField label="Aciertos para el festejo grande" value={config.settings.bigCelebrationAt} min={1} max={20} onChange={(v) => setSettings({ bigCelebrationAt: v })} />
          <NumberField label="Volver al inicio sin tocar (segundos)" value={config.settings.idleResetSeconds} min={15} max={300} onChange={(v) => setSettings({ idleResetSeconds: v })} />
        </div>
        <label className="field">
          <span>Cuando la respuesta es incorrecta</span>
          <select value={config.settings.wrongAnimation} onChange={(e) => setSettings({ wrongAnimation: e.target.value as WrongAnimation })}>
            <option value="casi">Pollito sorprendido y «¡Casi!»</option>
            <option value="timido">Pollito tímido que se asoma</option>
          </select>
        </label>
        <label className="consent">
          <input id="op-sound" type="checkbox" checked={config.settings.sound} onChange={(e) => setSettings({ sound: e.target.checked })} />
          <span>Sonido activado</span>
        </label>
        <TextField
          label="PIN del operador (solo números)"
          value={config.settings.operatorPin}
          onChange={(v) => setSettings({ operatorPin: v.replace(/\D/g, '').slice(0, 8) || '1234' })}
        />
        <h3>Copiar a la otra tablet</h3>
        <p className="op-note">Exportá la configuración (marca, pollito, preguntas y ajustes) e importala en la otra tablet. El nombre de cada tablet se mantiene.</p>
        <div className="op-row">
          <button type="button" className="btn btn--ghost" onClick={() => save(`config-trivia-${stamp}.json`, JSON.stringify(config, null, 2), 'application/json')}>
            Exportar configuración
          </button>
          <FileButton
            label="Importar configuración"
            accept="application/json,.json"
            onFile={async (f) => {
              try {
                const merged = mergeConfig(JSON.parse(await f.text()) as Partial<GameConfig>);
                onSaveConfig({ ...merged, settings: { ...merged.settings, deviceName: config.settings.deviceName } });
                say('Configuración importada.');
              } catch {
                say('No se pudo leer el archivo de configuración.');
              }
            }}
          />
          <ConfirmButton label="Restaurar de fábrica" confirmLabel="Sí, restaurar" onConfirm={() => (onResetConfig(), say('Configuración de fábrica restaurada.'))} />
        </div>
      </>
    );
  }

  return (
    <div className="operator">
      <div className="card operator__card operator__card--wide">
        <div className="op-head">
          <h2 className="card__title">Operador · {config.settings.deviceName}</h2>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Volver al juego
          </button>
        </div>
        <div className="op-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => (setTab(t.id), setMsg(''))}>
              {t.label}
            </button>
          ))}
        </div>
        <section className="op-section">{body}</section>
        {msg && <p className="op-msg">{msg}</p>}
        <p className="op-note">
          Para ver todas las pantallas fijas, abrí el juego agregando <b>#escenas</b> al final de la dirección.
        </p>
      </div>
    </div>
  );
}

function QuestionsTab({
  config,
  onSaveConfig,
  say,
  onTemplate,
}: {
  config: GameConfig;
  onSaveConfig: (c: GameConfig) => void;
  say: (m: string) => void;
  onTemplate: () => void;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const active = config.questions.filter((q) => q.active).length;
  const toggle = (id: string) =>
    onSaveConfig({ ...config, questions: config.questions.map((q) => (q.id === id ? { ...q, active: !q.active } : q)) });
  return (
    <>
      <p>
        <b>{active}</b> preguntas activas de {config.questions.length}. En cada partida salen {config.settings.questionsPerGame} al azar.
      </p>
      {active < config.settings.questionsPerGame && <p className="field__error">Hay menos preguntas activas que las que se piden por partida.</p>}
      <div className="op-row">
        <FileButton
          label="Cargar planilla (CSV)"
          accept=".csv,text/csv"
          primary
          onFile={async (f) => {
            const { questions, errors } = questionsFromCsv(await f.text());
            setErrors(errors);
            if (questions.length === 0) return say('No se cargó ninguna pregunta. Revisá la planilla.');
            onSaveConfig({ ...config, questions });
            say(`Se cargaron ${questions.length} preguntas${errors.length ? ` (${errors.length} filas con errores)` : ''}.`);
          }}
        />
        <button type="button" className="btn btn--ghost" onClick={onTemplate}>
          Descargar plantilla
        </button>
      </div>
      <p className="op-note">Columnas: id, pregunta, opcion_a, opcion_b, opcion_c, correcta (A, B o C), activa (si/no). Para Verdadero/Falso, dejá opcion_c vacía. Guardá la planilla como CSV desde Excel o Google Sheets.</p>
      {errors.length > 0 && (
        <ul className="op-errors">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <ol className="op-questions">
        {config.questions.map((q) => (
          <li key={q.id} className={q.active ? '' : 'is-off'}>
            <label className="consent">
              <input type="checkbox" checked={q.active} onChange={() => toggle(q.id)} />
              <span>
                <b>{q.text}</b>
                <br />
                {q.options.map((o, i) => (
                  <span key={i} className={i === q.correct ? 'op-correct' : ''}>
                    {['A', 'B', 'C', 'D'][i]}. {o}
                    {'  '}
                  </span>
                ))}
              </span>
            </label>
          </li>
        ))}
      </ol>
    </>
  );
}

function FileButton({ label, accept, onFile, primary }: { label: string; accept: string; onFile: (f: File) => void; primary?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={`btn ${primary ? 'btn--primary' : 'btn--ghost'}`} onClick={() => ref.current?.click()}>
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </>
  );
}

function ImageField({
  label,
  value,
  onChange,
  say,
  dark,
  maxSide = 512,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  say: (m: string) => void;
  dark?: boolean;
  maxSide?: number;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="op-row op-logo">
        <div className="op-logo__preview" style={dark ? { background: 'var(--brand)' } : undefined}>
          {value ? <img src={value} alt="" /> : <em>Sin imagen</em>}
        </div>
        <FileButton
          label="Elegir imagen"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onFile={async (f) => {
            try {
              onChange(await imageToDataUrl(f, maxSide));
              say('Imagen cargada.');
            } catch {
              say('No se pudo cargar la imagen.');
            }
          }}
        />
        {value && (
          <button type="button" className="btn btn--ghost" onClick={() => onChange('')}>
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field op-color">
      <span>{label}</span>
      <span className="op-color__row">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <input value={value} maxLength={7} onChange={(e) => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && onChange(e.target.value)} />
      </span>
    </label>
  );
}

function TextField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} /> : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
        }}
      />
    </label>
  );
}

function RangeField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="field">
      <span>
        {label}: {value.toFixed(2)}
      </span>
      <input type="range" min={min} max={max} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
