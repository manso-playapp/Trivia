import { useRef, useState } from 'react';
import type { GameConfig, PlayRecord } from '../config/types';
import { downloadText, playsToCsv } from '../lib/csv';
import { dailyRanking } from '../lib/game';
import { mergeConfig } from '../lib/storage';

/** Menú oculto del operador: se abre manteniendo apretado el logo 3 s + PIN. */
export function Operator({
  config,
  plays,
  onSaveConfig,
  onSavePlays,
  onResetConfig,
  onClose,
}: {
  config: GameConfig;
  plays: PlayRecord[];
  onSaveConfig: (c: GameConfig) => void;
  onSavePlays: (p: PlayRecord[]) => void;
  onResetConfig: () => void;
  onClose: () => void;
}) {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!unlocked) {
    const press = (d: string) => {
      const next = (pin + d).slice(0, 8);
      setPin(next);
      if (next === config.settings.operatorPin) setUnlocked(true);
    };
    return (
      <div className="operator">
        <div className="card operator__card">
          <h2 className="card__title">Operador</h2>
          <div className="pin">{pin.replace(/./g, '•') || 'Ingresá el PIN'}</div>
          <div className="keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} type="button" onClick={() => press(d)}>
                {d}
              </button>
            ))}
            <button type="button" onClick={() => setPin('')}>
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

  const today = dailyRanking(plays, new Date(), Number.MAX_SAFE_INTEGER);
  const stamp = new Date().toISOString().slice(0, 10);
  const device = config.settings.deviceName.replace(/\s+/g, '-').toLowerCase();

  const set = (patch: Partial<GameConfig['settings']>) => onSaveConfig({ ...config, settings: { ...config.settings, ...patch } });

  const importConfig = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<GameConfig>;
      // El nombre de la tablet se mantiene: así se puede copiar la configuración entre tablets.
      const merged = mergeConfig(parsed);
      onSaveConfig({ ...merged, settings: { ...merged.settings, deviceName: config.settings.deviceName } });
      setMsg('Configuración importada.');
    } catch {
      setMsg('No se pudo leer el archivo.');
    }
  };

  return (
    <div className="operator">
      <div className="card operator__card operator__card--wide">
        <h2 className="card__title">Operador</h2>

        <section className="op-section">
          <h3>Partidas</h3>
          <p>
            Hoy: <b>{today.length}</b> · Total guardadas: <b>{plays.length}</b> · Con permiso de contacto: <b>{plays.filter((p) => p.consent).length}</b>
          </p>
          <div className="op-row">
            <button type="button" className="btn btn--primary" onClick={() => downloadText(`partidas-${device}-${stamp}.csv`, playsToCsv(plays))}>
              Descargar planilla (CSV)
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (!confirm('¿Borrar el ranking y las partidas de HOY? Descargá la planilla antes.')) return;
                onSavePlays(plays.filter((p) => !today.some((t) => t.id === p.id)));
                setMsg('Partidas de hoy borradas.');
              }}
            >
              Borrar partidas de hoy
            </button>
          </div>
        </section>

        <section className="op-section">
          <h3>Tablet</h3>
          <label className="field">
            <span>Nombre de esta tablet (aparece en la planilla)</span>
            <input value={config.settings.deviceName} onChange={(e) => set({ deviceName: e.target.value })} />
          </label>
          <label className="consent">
            <input type="checkbox" checked={config.settings.sound} onChange={(e) => set({ sound: e.target.checked })} />
            <span>Sonido activado</span>
          </label>
          <label className="field">
            <span>PIN del operador</span>
            <input inputMode="numeric" value={config.settings.operatorPin} onChange={(e) => set({ operatorPin: e.target.value.replace(/\D/g, '').slice(0, 8) || '1234' })} />
          </label>
        </section>

        <section className="op-section">
          <h3>Configuración (marca y preguntas)</h3>
          <p>Para dejar las dos tablets iguales: exportá en una e importá en la otra.</p>
          <div className="op-row">
            <button type="button" className="btn btn--ghost" onClick={() => downloadText(`config-trivia-${stamp}.json`, JSON.stringify(config, null, 2), 'application/json')}>
              Exportar configuración
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
              Importar configuración
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importConfig(e.target.files[0])} />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (confirm('¿Volver a la configuración de fábrica? Las partidas no se borran.')) onResetConfig();
              }}
            >
              Restaurar de fábrica
            </button>
          </div>
        </section>

        {msg && <p className="op-msg">{msg}</p>}
        <button type="button" className="btn btn--primary btn--big" onClick={onClose}>
          Volver al juego
        </button>
      </div>
    </div>
  );
}
