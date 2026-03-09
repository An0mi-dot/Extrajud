import { Jimp } from 'jimp';
import pngToIco from 'png-to-ico';
import { writeFileSync } from 'fs';

const img = await Jimp.read('assets/logo_nova_transparente.png');
const sizes = [16, 32, 48, 64, 128, 256];
const pngs = [];
for (const s of sizes) {
  const buf = await img.clone().resize({ w: s, h: s }).getBuffer('image/png');
  pngs.push(buf);
}
const ico = await pngToIco(pngs);
writeFileSync('public/assets/icon.ico', ico);
console.log('ICO written:', ico.length, 'bytes');
