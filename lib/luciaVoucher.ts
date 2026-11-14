// Genera el voucher como imagen PNG en el navegador (canvas).
import { BRAND, formatDate } from './lucia';

export interface VoucherData {
  prize: string;
  code: string;
  phrase: string;
  legal: string;
  validUntil: string; // YYYY-MM-DD
}

const W = 1080;
const H = 1350;
const SERIF = '"Bodoni Moda", "Didot", "Times New Roman", serif';
const SANS = '"Jost", "Helvetica Neue", Arial, sans-serif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function ensureFonts() {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all([
    document.fonts.load(`600 100px "Bodoni Moda"`),
    document.fonts.load(`italic 400 40px "Bodoni Moda"`),
    document.fonts.load(`400 30px "Jost"`),
    document.fonts.load(`500 30px "Jost"`),
  ]).catch(() => undefined);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  // Texto centrado con tracking (letter-spacing) manual
  const chars = [...text];
  const total = chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  ctx.textAlign = 'left';
  for (const c of chars) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + spacing;
  }
  ctx.textAlign = 'center';
}

export async function renderVoucher(d: VoucherData): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const logo = await loadImage('/lucia/logo-negro.png');
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Fondo
  ctx.fillStyle = BRAND.olive;
  ctx.fillRect(0, 0, W, H);

  // Marco fino
  ctx.strokeStyle = BRAND.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, W - 88, H - 88);

  // Logo
  const lw = 440;
  const lh = (logo.height / logo.width) * lw;
  ctx.drawImage(logo, (W - lw) / 2, 110, lw, lh);
  let y = 110 + lh + 90;

  // Encabezado
  ctx.fillStyle = BRAND.ink;
  ctx.font = `500 28px ${SANS}`;
  spaced(ctx, '¡FELICITACIONES!', W / 2, y, 9);
  y += 68;

  // Frase
  ctx.font = `italic 400 44px ${SERIF}`;
  for (const l of wrap(ctx, d.phrase, 860)) {
    ctx.fillText(l, W / 2, y);
    y += 54;
  }

  // Premio (tamaño auto, máx. 2 líneas), centrado en el espacio libre
  let size = 112;
  let lines: string[] = [];
  for (; size >= 52; size -= 4) {
    ctx.font = `600 ${size}px ${SERIF}`;
    lines = wrap(ctx, d.prize, 880);
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= 880)) break;
  }
  const cutY = 900; // línea de corte fija
  const blockH = lines.length * size * 1.05;
  let py = y + (cutY - y - blockH) / 2 + size * 0.78;
  for (const l of lines) {
    ctx.fillText(l, W / 2, py);
    py += size * 1.05;
  }

  // Línea de corte punteada con muescas
  ctx.save();
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  ctx.moveTo(90, cutY);
  ctx.lineTo(W - 90, cutY);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = BRAND.cream;
  ctx.beginPath();
  ctx.arc(44, cutY, 26, 0, Math.PI * 2);
  ctx.arc(W - 44, cutY, 26, 0, Math.PI * 2);
  ctx.fill();

  // Código
  y = cutY + 70;
  ctx.fillStyle = BRAND.ink;
  ctx.font = `500 24px ${SANS}`;
  spaced(ctx, 'TU CÓDIGO', W / 2, y, 8);
  y += 26;
  const boxW = 620;
  const boxH = 120;
  ctx.fillRect((W - boxW) / 2, y, boxW, boxH);
  ctx.fillStyle = BRAND.cream;
  ctx.font = `500 66px ${SANS}`;
  spaced(ctx, d.code, W / 2, y + boxH / 2 + 23, 10);
  y += boxH + 56;

  // Instrucción + legales
  ctx.fillStyle = BRAND.ink;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText('Presentá este código en el local', W / 2, y);
  y += 46;
  ctx.font = `400 22px ${SANS}`;
  const legal = d.legal || `No acumulable con otras promociones. Válido hasta el ${formatDate(d.validUntil)}.`;
  for (const l of wrap(ctx, legal, 820).slice(0, 3)) {
    ctx.fillText(l, W / 2, y);
    y += 30;
  }

  return c;
}

export function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/png'));
}
