import type { APIRoute } from 'astro';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { exportToXml, importFromXml } from '@/lib/xml';
import { logger } from '@/lib/logger';

// GET → exportar inventario completo como XML
export const GET: APIRoute = async () => {
  try {
    const allProducts   = await db.select().from(products).orderBy(asc(products.name));
    const allCategories = await db.select().from(categories);

    const xml = exportToXml(allProducts, allCategories);

    const filename = `inventario_${new Date().toISOString().split('T')[0]}.xml`;

    return new Response(xml, {
      headers: {
        'Content-Type':        'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    logger.error({ err, path: '/api/xml (GET)' }, 'Error exporting XML');
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// POST → importar productos desde XML
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    let xmlString: string;

    // A-3: Validar tamaño y tipo de archivo
    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file') as File | null;
      if (!file) return new Response(JSON.stringify({ error: 'No se envió ningún archivo' }), { status: 400 });

      // Validar tamaño
      if (file.size > MAX_SIZE_BYTES) {
        return new Response(
          JSON.stringify({ error: 'Archivo demasiado grande. Máximo permitido: 2 MB' }),
          { status: 413 }
        );
      }

      // Validar que sea XML por extensión o tipo MIME
      const isXml = file.type.includes('xml') || file.name.toLowerCase().endsWith('.xml');
      if (!isXml) {
        return new Response(
          JSON.stringify({ error: 'Solo se aceptan archivos .xml' }),
          { status: 400 }
        );
      }

      xmlString = await file.text();
    } else {
      const raw = await request.text();
      if (raw.length > MAX_SIZE_BYTES) {
        return new Response(JSON.stringify({ error: 'Contenido demasiado grande (máx 2 MB)' }), { status: 413 });
      }
      xmlString = raw;
    }

    const xmlProducts = await importFromXml(xmlString);

    // Obtener categorías existentes para mapear por nombre
    const cats = await db.select().from(categories);
    const catMap = new Map(cats.map(c => [c.name.toLowerCase(), c.id]));

    let imported = 0;
    let skipped  = 0;

    for (const p of xmlProducts) {
      try {
        const catId = catMap.get((p.categoria ?? '').toLowerCase()) ?? null;

        const inserted = await db.insert(products).values({
          name:        p.nombre,
          description: p.descripcion || null,
          sku:         p.sku || null,
          categoryId:  catId,
          price:       p.precio?.toString() ?? '0',
          stock:       parseInt(p.stock ?? '0'),
          minStock:    parseInt(p.stockMinimo ?? '5'),
          unit:        p.unidad ?? 'pza',
        })
        .onConflictDoNothing() // Si el SKU ya existe, ignorar
        .returning({ id: products.id });

        if (inserted.length > 0) imported++;
        else skipped++;
      } catch {
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, imported, skipped, total: xmlProducts.length }),
      { status: 200 }
    );
  } catch (err: any) {
    logger.error({ err, path: '/api/xml (POST)' }, 'Error importing XML');
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
};
