export const COMMON_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];

const TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hormail.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yahoo.con': 'yahoo.com',
  'yaho.com': 'yahoo.com',
};

/** Sugerencias de mail completo mientras se escribe. */
export function emailSuggestions(value: string): string[] {
  const v = value.trim().toLowerCase();
  if (!v || /\s/.test(v)) return [];
  const at = v.indexOf('@');
  if (at === -1) return COMMON_DOMAINS.map((d) => `${v}@${d}`);
  const user = v.slice(0, at);
  const typed = v.slice(at + 1);
  if (!user) return [];
  if (COMMON_DOMAINS.includes(typed)) return [];
  return COMMON_DOMAINS.filter((d) => d.startsWith(typed)).map((d) => `${user}@${d}`);
}

/** "¿Quisiste decir ...?" para errores comunes de dominio. */
export function emailTypoFix(value: string): string | null {
  const v = value.trim().toLowerCase();
  const at = v.lastIndexOf('@');
  if (at < 1) return null;
  const fix = TYPOS[v.slice(at + 1)];
  return fix ? `${v.slice(0, at)}@${fix}` : null;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}
