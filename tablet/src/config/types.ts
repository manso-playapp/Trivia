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
  /** texto sobre el color principal */
  onBrand: string;
  /** fondo de las pantallas */
  background: string;
  /** trama del fondo (un tono del principal) */
  pattern: string;
  /** tarjetas */
  surface: string;
  text: string;
  muted: string;
  correct: string;
  wrong: string;
  /** familias tipográficas (deben estar incluidas en la app) */
  headingFont: string;
  bodyFont: string;
  /** logo como data URL (se carga desde el panel); vacío = solo texto */
  logo: string;
  /** nombre que se muestra si no hay logo */
  brandName: string;
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

export interface EggStyle {
  shell: string;
  shellShade: string;
  yolk: string;
  white: string;
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
}

export interface GameConfig {
  version: 1;
  theme: Theme;
  chick: ChickStyle;
  egg: EggStyle;
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
