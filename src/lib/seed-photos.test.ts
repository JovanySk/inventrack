import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { PRODUCT_PHOTOS } from './catalog';

// Comprueba que el catálogo de demostración (db/demo-seed.sql) asigne a cada
// producto una foto propia que exista en public/img/productos.
const seed = readFileSync('db/demo-seed.sql', 'utf8');
const skus = [...seed.matchAll(/^\s*\('[^']+',\s*'[^']*',\s*'([A-Z]{2}-\d{4})'/gm)].map(m => m[1]);
const mapping = new Map([...seed.matchAll(/\('([A-Z]{2}-\d{4})',\s*'([a-z0-9-]+)'\)/g)].map(m => [m[1], m[2]]));

describe('fotos del catálogo de demostración', () => {
  it('cada producto tiene una foto propia, sin repetir', () => {
    expect(skus.length).toBeGreaterThan(40);
    expect(new Set(skus).size).toBe(skus.length);
    for (const sku of skus) expect(mapping.get(sku), sku).toBeTruthy();
    const files = [...mapping.values()];
    expect(new Set(files).size).toBe(files.length);
  });

  it('cada foto existe en public/img/productos y se puede elegir en el formulario', () => {
    const selectable = new Set(PRODUCT_PHOTOS.map(p => p.file));
    for (const file of mapping.values()) {
      expect(existsSync(`public/img/productos/${file}.webp`), file).toBe(true);
      expect(selectable.has(`${file}.webp`), file).toBe(true);
    }
  });
});
