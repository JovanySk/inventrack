// Convierte las fotos originales (assets/img-src) a WebP optimizado en public/img/productos.
// Los originales quedan fuera de public/ para no inflar el bundle.
// Uso: node scripts/optimize-images.mjs
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets/img-src';
const OUT = 'public/img/productos';
await mkdir(OUT, { recursive: true });

for (const file of await readdir(SRC)) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue;
  const name = path.parse(file).name;
  const isBanner = name.startsWith('banner');
  const out = path.join(OUT, name + '.webp');
  const info = await sharp(path.join(SRC, file))
    .resize(isBanner ? { width: 1600, withoutEnlargement: true } : { width: 560, height: 560, fit: 'inside' })
    .webp({ quality: isBanner ? 78 : 80 })
    .toFile(out);
  console.log(out, Math.round(info.size / 1024) + ' KB');
}
