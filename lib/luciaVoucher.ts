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
  await Promise.all(['300', '400', '500'].map((w) => document.fonts.load(`${w} 40px "Jost"`))).catch(() => undefined);
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
  const logo = await loadImage('/lucia/logo-verde.png');
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Fondo crema con degradé suave a salvia
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, BRAND.cream);
  g.addColorStop(1, BRAND.mist);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Marco fino champagne
  ctx.strokeStyle = BRAND.champagne;
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // Logo
  const lw = 420;
  const lh = (logo.height / logo.width) * lw;
  ctx.drawImage(logo, (W - lw) / 2, 120, lw, lh);
  let y = 120 + lh + 92;

  ctx.fillStyle = BRAND.sageDark;
  ctx.font = `500 26px ${SANS}`;
  spaced(ctx, '¡FELICITACIONES!', W / 2, y, 10);
  y += 64;

  ctx.fillStyle = BRAND.deep;
  ctx.font = `300 40px ${SANS}`;
  for (const l of wrap(ctx, d.phrase, 860)) {
    ctx.fillText(l, W / 2, y);
    y += 52;
  }

  // Premio en mayúsculas, liviano y espaciado (tamaño auto, máx. 2 líneas)
  const prize = d.prize.toUpperCase();
  let size = 104;
  let lines: string[] = [];
  for (; size >= 48; size -= 4) {
    ctx.font = `400 ${size}px ${SANS}`;
    lines = wrap(ctx, prize, 860);
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width + l.length * size * 0.06 <= 880)) break;
  }
  const cutY = 900;
  const blockH = lines.length * size * 1.1;
  let py = y + (cutY - y - blockH) / 2 + size * 0.8;
  ctx.fillStyle = BRAND.deep;
  for (const l of lines) {
    spaced(ctx, l, W / 2, py, size * 0.06);
    py += size * 1.1;
  }

  // Línea de corte con muescas
  ctx.save();
  ctx.strokeStyle = BRAND.sage;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(96, cutY);
  ctx.lineTo(W - 96, cutY);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = BRAND.sageLight;
  ctx.beginPath();
  ctx.arc(48, cutY, 24, 0, Math.PI * 2);
  ctx.arc(W - 48, cutY, 24, 0, Math.PI * 2);
  ctx.fill();

  // Código
  y = cutY + 72;
  ctx.fillStyle = BRAND.sageDark;
  ctx.font = `500 22px ${SANS}`;
  spaced(ctx, 'TU CÓDIGO', W / 2, y, 8);
  y += 28;
  const boxW = 600;
  const boxH = 116;
  roundRect(ctx, (W - boxW) / 2, y, boxW, boxH, 58);
  ctx.fillStyle = BRAND.sageDark;
  ctx.fill();
  ctx.fillStyle = BRAND.cream;
  ctx.font = `400 60px ${SANS}`;
  spaced(ctx, d.code, W / 2, y + boxH / 2 + 21, 10);
  y += boxH + 58;

  ctx.fillStyle = BRAND.deep;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText('Presentá este código en el local', W / 2, y);
  y += 44;
  ctx.fillStyle = BRAND.sageDark;
  ctx.font = `300 22px ${SANS}`;
  const legal = d.legal || `No acumulable con otras promociones. Válido hasta el ${formatDate(d.validUntil)}.`;
  for (const l of wrap(ctx, legal, 820).slice(0, 3)) {
    ctx.fillText(l, W / 2, y);
    y += 30;
  }

  return c;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/png'));
}
