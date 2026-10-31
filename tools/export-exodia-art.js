// Re-renders the Exodia layers of EXODIA_SVG (src/effects/logo-easter-egg.js)
// to img/exodia-*.webp. Run it after changing the drawing; it isn't part of
// the app. Needs Node and Chrome:
//   npm i --no-save puppeteer-core
//   node tools/export-exodia-art.js
// The crop boxes (viewBox units) must match .exo-img--body / .exo-img--hands
// in effects.css.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  page.on('pageerror', e => console.error(e.message));
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ path: path.join(ROOT, 'src', 'effects', 'logo-easter-egg.js') });

  const files = await page.evaluate(async () => {
    const div = document.createElement('div');
    div.innerHTML = EXODIA_SVG;
    const [, lit, fists, open] = div.querySelectorAll('svg');
    const xml = n => new XMLSerializer().serializeToString(n);
    const defs = xml(lit.querySelector('defs'));
    const inner = svg => [...svg.childNodes].filter(n => n.nodeName !== 'defs').map(xml).join('');
    const svgDoc = (box, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}" width="${box[2]}" height="${box[3]}">${defs}${body}</svg>`;
    const load = src => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
    });
    const render = async (box, bodies, scale, filter) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(box[2] * scale);
      canvas.height = Math.round(box[3] * scale);
      const ctx = canvas.getContext('2d');
      if (filter) ctx.filter = filter;
      for (const body of bodies) ctx.drawImage(await load(svgDoc(box, body)), 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', 0.86);
    };
    const BODY = [-100, 240, 1200, 1360];
    const HANDS = [55, 770, 890, 400];
    return {
      'exodia-lit': await render(BODY, [inner(lit)], 1.2),
      'exodia-fists': await render(HANDS, [inner(fists)], 1.2),
      'exodia-open': await render(HANDS, [inner(open)], 1.2),
      // The silhouette in the haze: darkened and soft, so low resolution is fine.
      'exodia-sil': await render(BODY, [inner(lit), inner(fists)], 0.5, 'brightness(0.3) saturate(1.5) blur(2px)')
    };
  });

  fs.mkdirSync(path.join(ROOT, 'img'), { recursive: true });
  for (const [name, dataUrl] of Object.entries(files)) {
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(ROOT, 'img', `${name}.webp`), buf);
    console.log(`img/${name}.webp ${Math.round(buf.length / 1024)} KB`);
  }
  await browser.close();
})();
