import type { PlayRecord } from '../config/types';

function cell(v: string | number | boolean): string {
  const s = String(v);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Planilla de partidas. Separador ";" y BOM para que Excel en español la abra bien. */
export function playsToCsv(plays: PlayRecord[]): string {
  const header = ['tablet', 'fecha', 'hora', 'nombre', 'mail', 'telefono', 'acepta_contacto', 'aciertos', 'preguntas', 'puntaje'];
  const rows = plays.map((p) => {
    const d = new Date(p.playedAt);
    const fecha = d.toLocaleDateString('es-AR');
    const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return [p.device, fecha, hora, p.name, p.email, p.phone, p.consent ? 'si' : 'no', p.correct, p.total, p.score].map(cell).join(';');
  });
  return '﻿' + [header.join(';'), ...rows].join('\r\n');
}

/** Descarga un archivo de texto (en el navegador y dentro del APK). */
export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
