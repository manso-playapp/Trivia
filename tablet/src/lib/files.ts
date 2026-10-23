import { Capacitor } from '@capacitor/core';
import { downloadText } from './csv';

/**
 * Guarda un archivo de texto.
 * - En la tablet (APK): lo escribe en Documentos y abre "Compartir" (mail, Drive, WhatsApp, USB...).
 * - En el navegador: lo descarga.
 * Devuelve un mensaje para mostrar al operador.
 */
export async function saveTextFile(filename: string, text: string, mime = 'text/csv'): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    downloadText(filename, text, `${mime};charset=utf-8`);
    return `Descargado: ${filename}`;
  }
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  // Documentos (visible con un cable USB); si Android no lo permite, carpeta interna de la app.
  let where = 'Documentos';
  let res;
  try {
    res = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
  } catch {
    where = 'la memoria de la app';
    res = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
  }
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({ title: filename, files: [res.uri] });
  } catch {
    // Si se cancela "Compartir", el archivo igual queda guardado.
  }
  return `Guardado en ${where}: ${filename}`;
}

/** Lee un archivo elegido por el operador. */
export function readFileAsText(file: File): Promise<string> {
  return file.text();
}

/** Convierte una imagen en data URL achicada (para guardar el logo en la tablet). */
export function imageToDataUrl(file: File, maxSide = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const src = String(reader.result);
      if (file.type === 'image/svg+xml') return resolve(src);
      const img = new Image();
      img.onerror = () => reject(new Error('La imagen no es válida.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
