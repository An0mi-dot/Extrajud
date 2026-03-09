import { Jimp } from 'jimp';
import pngToIco from 'png-to-ico';
import { writeFileSync } from 'fs';

const raw = await Jimp.read('assets/logo_nova_transparente.png');
const w = raw.width, h = raw.height;

// Find exact bounds of non-transparent content
let top = h, bottom = 0, left = w, right = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const a = raw.getPixelColor(x, y) & 0xff;
    if (a > 10) {
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
}
// Add 3% padding so the logo doesn't touch the icon edges
const pad = Math.round(Math.max(right - left, bottom - top) * 0.03);
top    = Math.max(0, top - pad);
bottom = Math.min(h - 1, bottom + pad);
left   = Math.max(0, left - pad);
right  = Math.min(w - 1, right + pad);
console.log(`Cropping to ${left},${top} → ${right},${bottom}  (${right-left}×${bottom-top})`);

const img = raw.clone().crop({ x: left, y: top, w: right - left, h: bottom - top });
const sizes = [16, 32, 48, 64, 128, 256];
const pngs = [];
for (const s of sizes) {
  const buf = await img.clone().resize({ w: s, h: s }).getBuffer('image/png');
  pngs.push(buf);
}
const ico = await pngToIco(pngs);
writeFileSync('public/assets/icon.ico', ico);
console.log('ICO written:', ico.length, 'bytes');
