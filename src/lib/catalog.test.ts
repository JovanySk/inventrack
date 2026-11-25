import { describe, it, expect } from 'vitest';
import {
  productImage, categoryImage, isValidProductImage, PLACEHOLDER_IMG, PRODUCT_PHOTOS, IMG_DIR,
  stockLevel, availabilityPct, suggestedOrder, sortByUrgency, restockSummary,
  daysOfCover, shortName, aisleLabel, buildSlides, wrapIndex, marqueeName, unitLabel,
} from './catalog';

describe('imágenes de producto', () => {
  it('usa la imagen guardada si es válida', () => {
    expect(productImage({ image: '/img/productos/taladro.webp', name: 'Martillo' })).toBe('/img/productos/taladro.webp');
  });
  it('ignora rutas externas o inválidas', () => {
    expect(isValidProductImage('https://evil.test/x.webp')).toBe(false);
    expect(isValidProductImage('/img/productos/../x.webp')).toBe(false);
    expect(productImage({ image: 'javascript:alert(1)', name: 'Taladro percutor' })).toBe('/img/productos/taladro.webp');
  });
  it('coincide por nombre, sin importar acentos', () => {
    expect(productImage({ name: 'Flexómetro 5 m' })).toBe('/img/productos/flexometro.webp');
    expect(productImage({ name: 'Taquete plástico 1/4"' })).toBe('/img/productos/taquete-plastico.webp');
    expect(productImage({ name: 'Sierra circular 7 1/4"' })).toBe('/img/productos/sierra-circular.webp');
    expect(productImage({ name: 'Serrucho de carpintero 20"' })).toBe('/img/productos/serrucho.webp');
    expect(productImage({ name: 'Pinza de presión 10"' })).toBe('/img/productos/pinza-presion.webp');
    expect(productImage({ name: 'Juego de brocas para metal' })).toBe('/img/productos/juego-brocas-metal.webp');
    expect(productImage({ name: 'Audífonos con micrófono USB' })).toBe('/img/productos/audifonos.webp');
    expect(productImage({ name: 'Tóner compatible 85A' })).toBe('/img/productos/toner.webp');
  });
  it('cae a la foto de la categoría y luego al genérico', () => {
    expect(productImage({ name: 'Mazo de goma', categoryName: 'Herramientas manuales' })).toBe('/img/productos/martillo-una.webp');
    expect(categoryImage('Herramientas eléctricas')).toBe('/img/productos/taladro.webp');
    expect(categoryImage('Cómputo y accesorios')).toBe('/img/productos/mouse-inalambrico.webp');
    expect(categoryImage('Limpieza')).toBe('/img/productos/limpiador-multiusos.webp');
    expect(productImage({ name: 'Artículo nuevo', categoryName: 'Jardinería' })).toBe(PLACEHOLDER_IMG);
  });
  it('cada foto del catálogo es una ruta válida y no se repite', () => {
    const files = PRODUCT_PHOTOS.map(p => p.file);
    expect(new Set(files).size).toBe(files.length);
    for (const f of files) expect(isValidProductImage(IMG_DIR + f)).toBe(true);
  });
});

describe('niveles de existencia', () => {
  it('clasifica agotado, crítico, bajo y disponible', () => {
    expect(stockLevel({ stock: 0, minStock: 40 })).toBe('out');
    expect(stockLevel({ stock: 3, minStock: 12 })).toBe('critical');
    expect(stockLevel({ stock: 9, minStock: 30 })).toBe('low');
    expect(stockLevel({ stock: 10, minStock: 10 })).toBe('low');
    expect(stockLevel({ stock: 11, minStock: 10 })).toBe('ok');
  });
  it('calcula la barra con tope en 100 y mínimo visible', () => {
    expect(availabilityPct({ stock: 0, minStock: 5 })).toBe(0);
    expect(availabilityPct({ stock: 12, minStock: 10 })).toBe(60);
    expect(availabilityPct({ stock: 100, minStock: 5 })).toBe(100);
    expect(availabilityPct({ stock: 1, minStock: 100 })).toBe(4);
  });
});

describe('pedido sugerido y urgencia', () => {
  it('pide hasta el doble del mínimo', () => {
    expect(suggestedOrder({ stock: 0, minStock: 40 })).toBe(80);
    expect(suggestedOrder({ stock: 3, minStock: 12 })).toBe(21);
    expect(suggestedOrder({ stock: 50, minStock: 5 })).toBe(1);
  });
  it('ordena por proporción existencia / mínimo', () => {
    const sorted = sortByUrgency([
      { name: 'B', stock: 9, minStock: 30 },
      { name: 'A', stock: 0, minStock: 40 },
      { name: 'C', stock: 3, minStock: 12 },
    ]);
    expect(sorted.map(p => p.name)).toEqual(['A', 'C', 'B']);
  });
  it('resume conteos y costo del reabastecimiento', () => {
    const s = restockSummary([
      { stock: 0, minStock: 40, price: 23 },
      { stock: 3, minStock: 12, price: '189' },
      { stock: 9, minStock: 30, price: 129 },
      { stock: 50, minStock: 5, price: 10 },
    ]);
    expect(s).toEqual({ count: 3, out: 1, critical: 1, low: 1, units: 80 + 21 + 51, cost: 80 * 23 + 21 * 189 + 51 * 129 });
  });
  it('estima días de cobertura', () => {
    expect(daysOfCover(11, 42)).toBe(7);
    expect(daysOfCover(5, 0)).toBeNull();
  });
});

describe('textos', () => {
  it('acorta nombres para la cinta', () => {
    expect(shortName('Tornillo para tablaroca 1" (100)')).toBe('Tornillo para tablaroca 1"');
    expect(shortName('Juego de brocas para metal 13 pzs')).toBe('Juego de brocas para');
  });
  it('etiqueta el pasillo', () => {
    expect(aisleLabel(3)).toBe('Pasillo 3');
    expect(aisleLabel(null)).toBe('Sin pasillo');
  });
});

describe('carrusel', () => {
  const totals = { totalProducts: 33, totalValue: 103855, totalUnits: 725 };
  it('siempre incluye la diapositiva de la tienda', () => {
    const slides = buildSlides({ totals, categoryCount: 7, lowStock: [], topSellers: [] });
    expect(slides).toHaveLength(1);
    expect(slides[0]).toMatchObject({ kind: 'store', products: 33, categories: 7 });
  });
  it('elige el producto más urgente y el más vendido', () => {
    const slides = buildSlides({
      totals, categoryCount: 7,
      lowStock: [
        { id: 1, name: 'Papel', stock: 9, minStock: 30, price: 129 },
        { id: 2, name: 'Disco', stock: 0, minStock: 40, price: 23 },
        { id: 3, name: 'Sano', stock: 50, minStock: 5, price: 1 },
      ],
      topSellers: [
        { id: 7, name: 'Taladro', stock: 18, unitsOut: 12 },
        { id: 8, name: 'Sierra', stock: 11, unitsOut: 42 },
      ],
    });
    expect(slides.map(s => s.kind)).toEqual(['store', 'restock', 'top']);
    const restock = slides[1] as Extract<typeof slides[number], { kind: 'restock' }>;
    expect(restock.product.id).toBe(2);
    expect(restock.level).toBe('out');
    expect(restock.order).toBe(80);
    expect(restock.cost).toBe(1840);
    const top = slides[2] as Extract<typeof slides[number], { kind: 'top' }>;
    expect(top.product.name).toBe('Sierra');
    expect(top.cover).toBe(7);
  });
  it('omite "más vendido" si no hubo salidas', () => {
    const slides = buildSlides({ totals, categoryCount: 7, lowStock: [], topSellers: [{ id: 1, name: 'X', stock: 1, unitsOut: 0 }] });
    expect(slides.map(s => s.kind)).toEqual(['store']);
  });
  it('envuelve el índice en ambos sentidos', () => {
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(5, 0)).toBe(0);
  });
});


describe('cinta y unidades', () => {
  it('arma nombres cortos con su medida', () => {
    expect(marqueeName('Sierra circular 7 1/4" 1400 W')).toBe('Sierra circular 7 1/4"');
    expect(marqueeName('Disco de corte metal 4 1/2"')).toBe('Disco de corte 4 1/2"');
    expect(marqueeName('Flexómetro 5 m')).toBe('Flexómetro 5 m');
    expect(marqueeName('Taladro percutor 1/2" 650 W')).toBe('Taladro percutor 1/2"');
    expect(marqueeName('Tornillo para tablaroca 1" (100)')).toBe('Tornillo para tablaroca 1"');
    expect(marqueeName('Martillo de una')).toBe('Martillo de una');
  });
  it('pluraliza la unidad', () => {
    expect(unitLabel('pza', 1)).toBe('pza');
    expect(unitLabel('pza', 80)).toBe('pzas');
    expect(unitLabel('paquete', 51)).toBe('paq');
    expect(unitLabel('lt', 6)).toBe('lt');
    expect(unitLabel(null, 2)).toBe('pzas');
  });
});
