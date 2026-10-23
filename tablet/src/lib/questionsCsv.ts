import type { Question } from '../config/types';

/** Lee CSV con separador "," o ";", comillas y BOM (como lo exportan Excel y Google Sheets). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export interface ImportResult {
  questions: Question[];
  errors: string[];
}

/**
 * Columnas de la planilla: id, pregunta, opcion_a, opcion_b, opcion_c, correcta (A/B/C), activa (si/no).
 * opcion_c vacía = pregunta de 2 opciones (Verdadero/Falso).
 */
export function questionsFromCsv(text: string): ImportResult {
  const rows = parseCsv(text);
  const errors: string[] = [];
  if (rows.length < 2) return { questions: [], errors: ['La planilla está vacía o no tiene encabezado.'] };
  const header = rows[0].map(norm);
  const col = (name: string) => header.indexOf(name);
  const iText = col('pregunta');
  const iOpts = ['opcion_a', 'opcion_b', 'opcion_c', 'opcion_d'].map(col);
  const iCorrect = col('correcta');
  const iId = col('id');
  const iActive = col('activa');
  if (iText < 0 || iOpts[0] < 0 || iOpts[1] < 0 || iCorrect < 0) {
    return { questions: [], errors: ['Faltan columnas. Se necesitan: pregunta, opcion_a, opcion_b, correcta.'] };
  }
  const questions: Question[] = [];
  rows.slice(1).forEach((r, n) => {
    const line = n + 2;
    const get = (i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
    const text = get(iText);
    const options = iOpts.map(get).filter((o) => o !== '');
    const letter = norm(get(iCorrect)).toUpperCase();
    const correct = ['A', 'B', 'C', 'D'].indexOf(letter);
    if (!text) return errors.push(`Fila ${line}: falta la pregunta.`);
    if (options.length < 2) return errors.push(`Fila ${line}: necesita al menos 2 opciones.`);
    if (correct < 0 || correct >= options.length) return errors.push(`Fila ${line}: "correcta" debe ser una letra de una opción que exista (A, B o C).`);
    const active = iActive < 0 || !['no', 'n', '0', 'false'].includes(norm(get(iActive)));
    questions.push({ id: get(iId) || `q${line}`, text, options, correct, active });
  });
  return { questions, errors };
}

export const QUESTIONS_TEMPLATE =
  '﻿id;pregunta;opcion_a;opcion_b;opcion_c;correcta;activa\r\n' +
  '1;¿Cuántos días tiene un año bisiesto?;365;366;364;B;si\r\n' +
  '2;La Luna tiene luz propia.;Verdadero;Falso;;B;si\r\n';
