import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrandBadge } from '../components/Brand';
import { Chick } from '../components/Chick';
import { useConfig } from '../lib/configContext';
import { emailSuggestions, emailTypoFix, isValidEmail, isValidPhone } from '../lib/email';
import { sfx } from '../lib/sound';

export interface Player {
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}

export const anonymousPlayer: Player = { name: '', email: '', phone: '', consent: false };

export function Register({ onDone }: { onDone: (p: Player) => void }) {
  const { texts } = useConfig();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);

  const suggestions = emailSuggestions(email);
  const typo = emailTypoFix(email);
  const emailBad = email.trim() !== '' && !isValidEmail(email);
  const phoneBad = phone.trim() !== '' && !isValidPhone(phone);
  const hasContact = email.trim() !== '' || phone.trim() !== '';

  const play = () => {
    sfx.tap();
    setTouched(true);
    if (emailBad || phoneBad) return;
    // Sin permiso no se guardan mail ni teléfono (pero se juega igual).
    onDone({
      name: name.trim().slice(0, 30),
      email: consent ? email.trim().toLowerCase() : '',
      phone: consent ? phone.trim() : '',
      consent: consent && hasContact,
    });
  };

  return (
    <div className="screen register">
      <BrandBadge size={64} />
      <motion.div
        className="card register__card"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      >
        <h2 className="card__title">{texts.registerTitle}</h2>
        <p className="register__hint">Todos los datos son opcionales.</p>

        <label className="field">
          <span>Nombre (opcional)</span>
          <input value={name} maxLength={30} autoComplete="off" onChange={(e) => setName(e.target.value)} placeholder="¿Cómo te llamás?" />
        </label>

        <label className="field">
          <span>Mail (opcional)</span>
          <input
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@mail.com"
            className={touched && emailBad ? 'is-bad' : ''}
          />
        </label>
        {suggestions.length > 0 && (
          <div className="chips">
            {suggestions.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => setEmail(s)}>
                @{s.split('@')[1]}
              </button>
            ))}
          </div>
        )}
        {typo && (
          <button type="button" className="typo" onClick={() => setEmail(typo)}>
            ¿Quisiste decir <b>{typo}</b>?
          </button>
        )}
        {touched && emailBad && !typo && <p className="field__error">Revisá el mail o dejalo vacío.</p>}

        <label className="field">
          <span>Teléfono (opcional)</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s+()-]/g, ''))}
            placeholder="Ej.: 351 555 1234"
            className={touched && phoneBad ? 'is-bad' : ''}
          />
        </label>
        {touched && phoneBad && <p className="field__error">Revisá el teléfono o dejalo vacío.</p>}

        {hasContact && (
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{texts.consent}</span>
          </label>
        )}
        {hasContact && !consent && <p className="register__hint">Si no tildás la casilla, jugás igual pero no guardamos tu mail ni tu teléfono.</p>}
        <p className="privacy">{texts.privacy}</p>

        <div className="register__actions">
          <button type="button" className="btn btn--primary" onClick={play}>
            ¡Jugar!
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => (sfx.tap(), onDone(anonymousPlayer))}>
            Jugar sin dejar datos
          </button>
        </div>
      </motion.div>
      <div className="register__chick">
        <Chick pose="peck" size="min(110px, 18cqw)" />
      </div>
    </div>
  );
}
