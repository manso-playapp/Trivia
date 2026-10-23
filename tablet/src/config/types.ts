export interface Question {
  id: string;
  text: string;
  /** 2 (Verdadero/Falso) o 3 opciones */
  options: string[];
  /** índice de la opción correcta */
  correct: number;
  active: boolean;
}

export interface Theme {
  /** color principal de la marca */
  brand: string;
  /** texto sobre el color principal y sobre el fondo */
  onBrand: string;
  /** fondo de las pantallas */
  background: string;
  /** bandas inclinadas del fondo (un tono del principal) */
  pattern: string;
  /** tarjetas */
  surface: string;
  text: string;
  /** color secundario (textos suaves) */
  muted: string;
  correct: string;
  wrong: string;
  /** familias tipográficas (deben estar incluidas en la app) */
  headingFont: string;
  bodyFont: string;
  /** logo para fondos claros (URL o data URL); vacío = solo texto */
  logo: string;
  /** logo para el fondo de color (versión en blanco); vacío = se usa el logo común en un círculo */
  logoOnBrand: string;
  /** foto de portada de la pantalla de espera (con fondo recortado); vacío = pollito dibujado */
  hero: string;
  /** nombre que se muestra si no hay logo */
  brandName: string;
  slogan: string;
}

export interface ChickStyle {
  body: string;
  bodyShade: string;
  beak: string;
  legs: string;
  eye: string;
  cheek: string;
  /** 0.8 a 1.2 */
  headScale: number;
  /** 0.7 a 1.4 */
  eyeScale: number;
}

export interface Texts {
  attractTitle: string;
  attractCta: string;
  registerTitle: string;
  privacy: string;
  consent: string;
  congrats: string;
  thanks: string;
}

export type WrongAnimation = 'casi' | 'timido';

export interface Settings {
  questionsPerGame: number;
  secondsPerQuestion: number;
  /** aciertos para el festejo grande */
  bigCelebrationAt: number;
  idleResetSeconds: number;
  operatorPin: string;
  /** identifica la tablet en la planilla (ej. "Tablet 1") */
  deviceName: string;
  sound: boolean;
  /** animación cuando la respuesta es incorrecta */
  wrongAnimation: WrongAnimation;
}

export interface GameConfig {
  version: 1;
  theme: Theme;
  chick: ChickStyle;
  texts: Texts;
  settings: Settings;
  questions: Question[];
}

export interface PlayRecord {
  id: string;
  device: string;
  /** ISO */
  playedAt: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  correct: number;
  total: number;
  score: number;
}
