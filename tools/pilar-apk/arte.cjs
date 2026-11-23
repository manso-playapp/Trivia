// Regenera el arte de public/pilar/assets a partir de arte.html. Uso: node tools/pilar-apk/arte.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const out = path.join(__dirname, '../../public/pilar/assets');
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1800, height: 2000 } });
  for (const [pieza, archivo, tipo, ancho] of [['fondo', 'fondo.jpg', 'image/jpeg', 1080], ['rosa', 'brillo-rosa.jpg', 'image/jpeg', 420],
    ['violeta', 'brillo-violeta.jpg', 'image/jpeg', 420], ['logo', 'logo.webp', 'image/webp', 1200]]) {
    await p.goto('file://' + path.join(__dirname, 'arte.html') + '?pieza=' + pieza);
    await p.waitForFunction(() => document.title === 'listo');
    const url = await p.evaluate(([tipo, ancho]) => {
      const c = document.getElementById('c'), d = document.createElement('canvas');
      d.width = ancho; d.height = Math.round(c.height * ancho / c.width);
      const x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, d.width, d.height);
      return d.toDataURL(tipo, 0.9);
    }, [tipo, ancho]);
    fs.writeFileSync(path.join(out, archivo), Buffer.from(url.split(',')[1], 'base64'));
    console.log(archivo);
  }
  await b.close();
})();
