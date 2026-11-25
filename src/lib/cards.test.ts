import { describe, it, expect } from 'vitest';
import { productCardHtml, cardBadge } from './cards';

const base = { id: 1, name: 'Disco de corte metal 4 1/2"', sku: 'HE-0204', price: 23, stock: 0, minStock: 40, categoryId: 2 };

describe('tarjeta de producto', () => {
  it('prioriza el estado de existencia en la etiqueta', () => {
    expect(cardBadge(base)?.text).toBe('Agotado');
    expect(cardBadge({ ...base, stock: 26, minStock: 60 })?.text).toBe('Bajo');
    expect(cardBadge({ ...base, stock: 50, minStock: 5 }, { text: 'Más vendido', cls: 'badge-ink' })?.text).toBe('Más vendido');
    expect(cardBadge({ ...base, stock: 50, minStock: 5, unitsOutToday: 14 })?.text).toBe('-14 hoy');
    expect(cardBadge({ ...base, stock: 50, minStock: 5 })).toBeNull();
  });
  it('escapa el nombre y usa la foto del catálogo', () => {
    const html = productCardHtml({ ...base, name: '<img onerror=x>' });
    expect(html).not.toContain('<img onerror');
    expect(html).toContain('&lt;img onerror=x&gt;');
    expect(html).toContain('/img/productos/');
    expect(html).toContain('Pasillo 2');
    expect(html).toContain('data-pct="0"');
  });
});
