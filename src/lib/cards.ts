// Plantillas HTML compartidas (tarjeta de producto) para los scripts de cliente.
import { esc, money, int } from './ui';
import { productImage, stockLevel, availabilityPct, aisleLabel, LEVEL_LABEL, type StockLevel } from './catalog';

export interface CardProduct {
  id: number;
  name: string;
  sku?: string | null;
  price: number | string;
  stock: number;
  minStock: number;
  unit?: string | null;
  image?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  unitsOutToday?: number;
  unitsOut30?: number;
  lastEntryQty?: number | null;
}

export type CardBadge = { text: string; cls: string } | null;

/** Etiqueta superior: el estado de existencia manda; si está bien surtido se usa la del contexto. */
export function cardBadge(p: CardProduct, context: CardBadge = null): CardBadge {
  const level = stockLevel(p);
  if (level === 'out') return { text: 'Agotado', cls: 'badge-danger' };
  if (level === 'critical') return { text: 'Crítico', cls: 'badge-danger' };
  if (level === 'low') return { text: 'Bajo', cls: 'badge-warning' };
  if (context) return context;
  if (p.unitsOutToday && p.unitsOutToday > 0) return { text: '-' + p.unitsOutToday + ' hoy', cls: 'badge-ink' };
  return null;
}

export function priceText(n: number | string): string {
  return money(n);
}

export function productCardHtml(p: CardProduct, opts: { badge?: CardBadge; actions?: string } = {}): string {
  const level: StockLevel = stockLevel(p);
  const badge = cardBadge(p, opts.badge ?? null);
  const meta = [p.sku || 'Sin SKU', aisleLabel(p.categoryId)].map(esc).join(' · ');
  const availCls = level === 'ok' ? 'ok' : level;
  return '<article class="pcard" data-id="' + p.id + '">' +
    (badge ? '<span class="badge ' + badge.cls + ' pcard-badge">' + esc(badge.text) + '</span>' : '') +
    '<div class="pcard-img"><img src="' + esc(productImage(p)) + '" alt="" loading="lazy" decoding="async" width="176" height="176"></div>' +
    '<h3 class="pcard-name">' + esc(p.name) + '</h3>' +
    '<div class="pcard-meta">' + meta + '</div>' +
    '<div class="pcard-price">' + esc(priceText(p.price)) + '</div>' +
    '<div class="bar" role="img" aria-label="' + esc(LEVEL_LABEL[level]) + '"><span class="bar-fill ' + level + '" data-pct="' + availabilityPct(p) + '"></span></div>' +
    '<div class="pcard-avail ' + availCls + '">Disponible: ' + int(p.stock) + ' · mín. ' + int(p.minStock) + '</div>' +
    (opts.actions ? '<div class="pcard-actions">' + opts.actions + '</div>' : '') +
  '</article>';
}
