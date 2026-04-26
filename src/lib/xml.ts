import { parseStringPromise, Builder } from 'xml2js';

// ─── Tipos ────────────────────────────────────────────────────────────
export interface XmlProduct {
  id:          string;
  nombre:      string;
  descripcion: string;
  sku:         string;
  categoria:   string;
  precio:      string;
  stock:       string;
  stockMinimo: string;
  unidad:      string;
  fechaCreacion: string;
}

export interface XmlInventario {
  inventario: {
    $: {
      version:    string;
      generado:   string;
      empresa:    string;
    };
    productos: Array<{ producto: XmlProduct[] }>;
    resumen: Array<{
      totalProductos: string[];
      valorTotal:     string[];
      stockBajo:      string[];
    }>;
  };
}

// ─── Exportar a XML ──────────────────────────────────────────────────
export function exportToXml(products: any[], categories: any[]): string {
  const catMap = new Map(categories.map((c: any) => [c.id, c.name]));

  const totalValue = products.reduce(
    (sum, p) => sum + parseFloat(p.price) * p.stock, 0
  );
  const lowStock = products.filter(p => p.stock <= p.minStock).length;

  const xmlObj = {
    inventario: {
      $: {
        version:  '1.0',
        generado: new Date().toISOString(),
        empresa:  'Mi Empresa S.A. de C.V.',
      },
      productos: [
        {
          producto: products.map(p => ({
            id:            p.id.toString(),
            nombre:        p.name,
            descripcion:   p.description ?? '',
            sku:           p.sku ?? '',
            categoria:     catMap.get(p.categoryId) ?? 'Sin categoría',
            precio:        parseFloat(p.price).toFixed(2),
            stock:         p.stock.toString(),
            stockMinimo:   p.minStock.toString(),
            unidad:        p.unit ?? 'pza',
            fechaCreacion: p.createdAt?.toISOString() ?? new Date().toISOString(),
          })),
        },
      ],
      resumen: [
        {
          totalProductos: [products.length.toString()],
          valorTotal:     [totalValue.toFixed(2)],
          stockBajo:      [lowStock.toString()],
        },
      ],
    },
  };

  const builder = new Builder({
    xmldec:      { version: '1.0', encoding: 'UTF-8' },
    renderOpts:  { pretty: true, indent: '  ', newline: '\n' },
    rootName:    'root',
    headless:    false,
  });

  return builder.buildObject(xmlObj);
}

// ─── Importar desde XML ──────────────────────────────────────────────
export async function importFromXml(xmlString: string): Promise<XmlProduct[]> {
  try {
    const parsed: XmlInventario = await parseStringPromise(xmlString, {
      explicitArray: false,
      mergeAttrs:    false,
    });

    const productosRaw = parsed.inventario?.productos;
    if (!productosRaw) throw new Error('Formato XML inválido: no se encontraron productos');

    const lista = productosRaw[0]?.producto;
    if (!lista) throw new Error('No hay productos en el XML');

    const arr = Array.isArray(lista) ? lista : [lista];
    return arr;
  } catch (err: any) {
    throw new Error(`Error al parsear XML: ${err.message}`);
  }
}
