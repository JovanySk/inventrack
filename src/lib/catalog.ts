// Helpers puros del catálogo: fotos, niveles de existencia, pedido sugerido,
// orden por urgencia y selección de las diapositivas del carrusel.
// Se usan en servidor (páginas Astro) y en cliente (scripts de página).

export const IMG_DIR = '/img/productos/';
export const PLACEHOLDER_IMG = IMG_DIR + 'sin-foto.svg';
export const BANNER_IMG = IMG_DIR + 'banner-herramientas.webp';

/** Fotos disponibles para elegir en el formulario de producto (una por producto del catálogo demo). */
export const PRODUCT_PHOTOS: { file: string; label: string }[] = [
  // Herramientas manuales
  { file: 'martillo-una.webp',         label: 'Martillo' },
  { file: 'juego-desarmadores.webp',   label: 'Desarmadores' },
  { file: 'llave-ajustable.webp',      label: 'Llave ajustable' },
  { file: 'pinza-electricista.webp',   label: 'Pinza de electricista' },
  { file: 'pinza-presion.webp',        label: 'Pinza de presión' },
  { file: 'flexometro.webp',           label: 'Flexómetro' },
  { file: 'nivel-torpedo.webp',        label: 'Nivel' },
  { file: 'serrucho.webp',             label: 'Serrucho' },
  // Herramientas eléctricas
  { file: 'taladro.webp',              label: 'Taladro' },
  { file: 'rotomartillo.webp',         label: 'Rotomartillo' },
  { file: 'esmeriladora.webp',         label: 'Esmeriladora' },
  { file: 'sierra-circular.webp',      label: 'Sierra circular' },
  { file: 'lijadora-orbital.webp',     label: 'Lijadora' },
  { file: 'pistola-calor.webp',        label: 'Pistola de calor' },
  { file: 'juego-brocas-metal.webp',   label: 'Brocas' },
  { file: 'disco-corte.webp',          label: 'Disco de corte' },
  // Tornillería y fijación
  { file: 'tornillo-tablaroca.webp',   label: 'Tornillo para tablaroca' },
  { file: 'tornillo-hexagonal.webp',   label: 'Tornillo hexagonal' },
  { file: 'taquete-plastico.webp',     label: 'Taquete' },
  { file: 'clavo-estandar.webp',       label: 'Clavo' },
  { file: 'ancla-expansiva.webp',      label: 'Ancla expansiva' },
  { file: 'abrazadera-sinfin.webp',    label: 'Abrazadera' },
  // Pinturas y adhesivos
  { file: 'pintura.webp',              label: 'Pintura vinílica' },
  { file: 'esmalte-negro.webp',        label: 'Esmalte' },
  { file: 'sellador-acrilico.webp',    label: 'Sellador' },
  { file: 'pegamento-contacto.webp',   label: 'Pegamento' },
  { file: 'silicon-transparente.webp', label: 'Silicón' },
  { file: 'rodillo-pintar.webp',       label: 'Rodillo' },
  { file: 'brocha.webp',               label: 'Brocha' },
  // Papelería
  { file: 'papel-bond.webp',           label: 'Papel bond' },
  { file: 'cuaderno-profesional.webp', label: 'Cuaderno' },
  { file: 'boligrafo-azul.webp',       label: 'Bolígrafos' },
  { file: 'marcatextos.webp',          label: 'Marcatextos' },
  { file: 'carpeta-carton.webp',       label: 'Carpeta' },
  { file: 'engrapadora.webp',          label: 'Engrapadora' },
  { file: 'cinta-canela.webp',         label: 'Cinta canela' },
  { file: 'calculadora.webp',          label: 'Calculadora' },
  // Cómputo y accesorios
  { file: 'mouse-inalambrico.webp',    label: 'Mouse' },
  { file: 'teclado-usb.webp',          label: 'Teclado' },
  { file: 'cable-hdmi.webp',           label: 'Cable HDMI' },
  { file: 'memoria-usb.webp',          label: 'Memoria USB' },
  { file: 'toner.webp',                label: 'Tóner' },
  { file: 'audifonos.webp',            label: 'Audífonos' },
  { file: 'multicontacto.webp',        label: 'Multicontacto' },
  // Limpieza
  { file: 'limpiador-multiusos.webp',  label: 'Limpiador' },
  { file: 'cloro.webp',                label: 'Cloro' },
  { file: 'gel-antibacterial.webp',    label: 'Gel antibacterial' },
  { file: 'toalla-interdoblada.webp',  label: 'Toalla de papel' },
  { file: 'bolsa-basura.webp',         label: 'Bolsa para basura' },
  { file: 'escoba.webp',               label: 'Escoba' },
  { file: 'jalador.webp',              label: 'Jalador' },
  { file: 'cubeta.webp',               label: 'Cubeta' },
  { file: 'sin-foto.svg',              label: 'Sin foto (genérica)' },
];

const IMAGE_RE = /^\/img\/productos\/[a-z0-9-]+\.(webp|svg)$/;

/** Valida que una ruta de imagen apunte a la carpeta de fotos del catálogo. */
export function isValidProductImage(path: unknown): boolean {
  return typeof path === 'string' && IMAGE_RE.test(path);
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Coincidencias por nombre de producto (primera que aplique). Se usan para productos sin foto
// guardada, p. ej. los creados desde la app o importados por XML.
const NAME_RULES: [RegExp, string][] = [
  [/serrucho/, 'serrucho.webp'],
  [/sierra/, 'sierra-circular.webp'],
  [/esmeril/, 'esmeriladora.webp'],
  [/rotomartillo/, 'rotomartillo.webp'],
  [/lijadora/, 'lijadora-orbital.webp'],
  [/pistola de calor/, 'pistola-calor.webp'],
  [/broca/, 'juego-brocas-metal.webp'],
  [/taladro/, 'taladro.webp'],
  [/disco/, 'disco-corte.webp'],
  [/pinza de presion|perico/, 'pinza-presion.webp'],
  [/pinza/, 'pinza-electricista.webp'],
  [/martillo/, 'martillo-una.webp'],
  [/desarmador/, 'juego-desarmadores.webp'],
  [/llave/, 'llave-ajustable.webp'],
  [/nivel/, 'nivel-torpedo.webp'],
  [/flexometro|cinta metrica/, 'flexometro.webp'],
  [/tablaroca/, 'tornillo-tablaroca.webp'],
  [/tornillo|pija/, 'tornillo-hexagonal.webp'],
  [/taquete/, 'taquete-plastico.webp'],
  [/clavo/, 'clavo-estandar.webp'],
  [/ancla/, 'ancla-expansiva.webp'],
  [/abrazadera/, 'abrazadera-sinfin.webp'],
  [/esmalte/, 'esmalte-negro.webp'],
  [/sellador/, 'sellador-acrilico.webp'],
  [/pegamento/, 'pegamento-contacto.webp'],
  [/silicon/, 'silicon-transparente.webp'],
  [/rodillo/, 'rodillo-pintar.webp'],
  [/brocha/, 'brocha.webp'],
  [/pintura|barniz|impermeab/, 'pintura.webp'],
  [/cuaderno|libreta/, 'cuaderno-profesional.webp'],
  [/boligrafo|pluma/, 'boligrafo-azul.webp'],
  [/marcatextos/, 'marcatextos.webp'],
  [/folder|carpeta/, 'carpeta-carton.webp'],
  [/engrapadora/, 'engrapadora.webp'],
  [/cinta canela|cinta de empaque/, 'cinta-canela.webp'],
  [/calculadora/, 'calculadora.webp'],
  [/papel|hojas|resma/, 'papel-bond.webp'],
  [/mouse/, 'mouse-inalambrico.webp'],
  [/teclado/, 'teclado-usb.webp'],
  [/hdmi/, 'cable-hdmi.webp'],
  [/audifonos|diadema/, 'audifonos.webp'],
  [/multicontacto|regleta|supresor/, 'multicontacto.webp'],
  [/memoria|usb/, 'memoria-usb.webp'],
  [/toner/, 'toner.webp'],
  [/cloro/, 'cloro.webp'],
  [/gel antibacterial|sanitizante/, 'gel-antibacterial.webp'],
  [/toalla/, 'toalla-interdoblada.webp'],
  [/bolsa/, 'bolsa-basura.webp'],
  [/escoba/, 'escoba.webp'],
  [/jalador/, 'jalador.webp'],
  [/limpiador|jabon|desengrasante/, 'limpiador-multiusos.webp'],
  [/cubeta/, 'cubeta.webp'],
];

// Foto representativa por categoría (pasillo).
const CATEGORY_RULES: [RegExp, string][] = [
  [/electric/, 'taladro.webp'],
  [/manual|herramienta/, 'martillo-una.webp'],
  [/tornill|fijacion/, 'ancla-expansiva.webp'],
  [/pintura|adhesiv/, 'pintura.webp'],
  [/papel/, 'papel-bond.webp'],
  [/computo|electronic/, 'mouse-inalambrico.webp'],
  [/limpieza/, 'limpiador-multiusos.webp'],
];

export function categoryImage(categoryName?: string | null): string {
  const c = norm(categoryName ?? '');
  for (const [re, file] of CATEGORY_RULES) if (re.test(c)) return IMG_DIR + file;
  return PLACEHOLDER_IMG;
}

/** Imagen a mostrar: la guardada, si no la que coincide por nombre, si no la de su categoría. */
export function productImage(p: { image?: string | null; name?: string | null; categoryName?: string | null }): string {
  if (p.image && isValidProductImage(p.image)) return p.image;
  const n = norm(p.name ?? '');
  for (const [re, file] of NAME_RULES) if (re.test(n)) return IMG_DIR + file;
  return categoryImage(p.categoryName);
}

// ── Existencias ──────────────────────────────────────────────

export type StockLevel = 'out' | 'critical' | 'low' | 'ok';

/** out: 0 · critical: hasta 25% del mínimo · low: en o bajo el mínimo · ok: por encima. */
export function stockLevel(p: { stock: number; minStock: number }): StockLevel {
  if (p.stock <= 0) return 'out';
  if (p.stock > p.minStock) return 'ok';
  if (p.minStock > 0 && p.stock / p.minStock <= 0.25) return 'critical';
  return 'low';
}

export const LEVEL_LABEL: Record<StockLevel, string> = {
  out: 'Agotado', critical: 'Crítico', low: 'Bajo', ok: 'Disponible',
};

/** Porcentaje de la barra de disponibilidad: 100% equivale al doble del mínimo. */
export function availabilityPct(p: { stock: number; minStock: number }): number {
  if (p.stock <= 0) return 0;
  const full = Math.max(1, p.minStock * 2);
  return Math.max(4, Math.min(100, Math.round((p.stock / full) * 100)));
}

/** Piezas a pedir para dejar el producto en el doble de su mínimo (al menos 1). */
export function suggestedOrder(p: { stock: number; minStock: number }): number {
  return Math.max(p.minStock * 2 - p.stock, 1);
}

/** Ordena de más a menos urgente: menor proporción existencia / mínimo primero, luego por nombre. */
export function sortByUrgency<T extends { stock: number; minStock: number; name: string }>(items: T[]): T[] {
  const ratio = (p: T) => (p.minStock > 0 ? p.stock / p.minStock : p.stock > 0 ? Infinity : 0);
  return [...items].sort((a, b) => ratio(a) - ratio(b) || a.name.localeCompare(b.name, 'es'));
}

export interface RestockSummary { count: number; out: number; critical: number; low: number; units: number; cost: number }

export function restockSummary(items: { stock: number; minStock: number; price: number | string }[]): RestockSummary {
  const s: RestockSummary = { count: 0, out: 0, critical: 0, low: 0, units: 0, cost: 0 };
  for (const p of items) {
    const level = stockLevel(p);
    if (level === 'ok') continue;
    s.count++;
    s[level]++;
    const qty = suggestedOrder(p);
    s.units += qty;
    s.cost += qty * Number(p.price);
  }
  s.cost = Math.round(s.cost * 100) / 100;
  return s;
}

/** Días que alcanza la existencia al ritmo de salidas de los últimos 30 días (null si no hubo salidas). */
export function daysOfCover(stock: number, unitsOut30: number): number | null {
  if (unitsOut30 <= 0) return null;
  return Math.floor(stock / (unitsOut30 / 30));
}

/** Nombre corto para la cinta de productos: sin paréntesis y con un máximo de palabras. */
export function shortName(name: string, maxWords = 4): string {
  const clean = name.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');
  return words.length > maxWords ? words.slice(0, maxWords).join(' ') : clean;
}

/** Etiqueta de ubicación: el pasillo corresponde al id de la categoría. */
export function aisleLabel(categoryId?: number | null): string {
  return categoryId ? 'Pasillo ' + categoryId : 'Sin pasillo';
}

// ── Carrusel del resumen ─────────────────────────────────────

export interface CarouselInput {
  totals: { totalProducts: number; totalValue: number; totalUnits: number };
  categoryCount: number;
  lowStock: Array<{ id: number; name: string; sku?: string | null; stock: number; minStock: number; price: number | string; unit?: string | null; image?: string | null; categoryName?: string | null; soldWeek?: number }>;
  topSellers: Array<{ id: number; name: string; sku?: string | null; stock: number; unitsOut: number; categoryId?: number | null; unit?: string | null; image?: string | null; categoryName?: string | null }>;
}

export type Slide =
  | { kind: 'store'; products: number; categories: number; value: number; units: number }
  | { kind: 'restock'; product: CarouselInput['lowStock'][number]; level: StockLevel; order: number; cost: number }
  | { kind: 'top'; product: CarouselInput['topSellers'][number]; cover: number | null };

/**
 * Siempre hay una diapositiva con los totales de la tienda; se agregan
 * "Reabastecer hoy" (el producto más urgente) y "Lo más vendido del mes"
 * (más unidades de salida en 30 días) cuando hay datos para ellas.
 */
export function buildSlides(input: CarouselInput): Slide[] {
  const slides: Slide[] = [{
    kind: 'store',
    products: input.totals.totalProducts,
    categories: input.categoryCount,
    value: input.totals.totalValue,
    units: input.totals.totalUnits,
  }];

  const urgent = sortByUrgency(input.lowStock.filter(p => stockLevel(p) !== 'ok'))[0];
  if (urgent) {
    const order = suggestedOrder(urgent);
    slides.push({ kind: 'restock', product: urgent, level: stockLevel(urgent), order, cost: Math.round(order * Number(urgent.price) * 100) / 100 });
  }

  const top = [...input.topSellers]
    .filter(p => p.unitsOut > 0)
    .sort((a, b) => b.unitsOut - a.unitsOut || a.name.localeCompare(b.name, 'es'))[0];
  if (top) slides.push({ kind: 'top', product: top, cover: daysOfCover(top.stock, top.unitsOut) });

  return slides;
}

/** Índice siguiente/anterior con vuelta al inicio. */
export function wrapIndex(i: number, length: number): number {
  if (length <= 0) return 0;
  return ((i % length) + length) % length;
}

/** Nombre para la cinta: hasta 3 palabras antes de la primera medida, más la medida (ej. "Sierra circular 7 1/4\""). */
export function marqueeName(name: string): string {
  const words = name.replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  const first = words.findIndex(w => /\d/.test(w));
  if (first === -1) return words.slice(0, 3).join(' ');
  const base = words.slice(0, Math.min(first, 3));
  const measure = [words[first]];
  const next = words[first + 1];
  if (next && (/^\d+\/\d+/.test(next) || /^[a-zA-Z]{1,3}$/.test(next))) measure.push(next);
  return [...base, ...measure].join(' ');
}

const PLURAL: Record<string, string> = { pza: 'pzas', caja: 'cajas', cubeta: 'cubetas', set: 'sets', paquete: 'paq', resma: 'resmas', rollo: 'rollos' };

/** Unidad abreviada con plural ("1 pza", "80 pzas", "51 paq"). */
export function unitLabel(unit: string | null | undefined, n: number): string {
  const u = unit || 'pza';
  if (u === 'paquete') return 'paq';
  return n === 1 ? u : (PLURAL[u] ?? u);
}
