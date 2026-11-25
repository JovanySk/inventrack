import type { APIRoute } from 'astro';
import { db } from '@/db';
import { products, categories, stockMovements, auditLogs } from '@/db/schema';
import { eq, asc, sql, ilike, or, and } from 'drizzle-orm';
import { sendLowStockAlert } from '@/lib/email';
import { logger } from '@/lib/logger';

import { validateProductBody } from '@/lib/validation';

export const GET: APIRoute = async ({ url }) => {
  try {
    const search     = url.searchParams.get('search')?.trim() ?? '';
    const categoryId = url.searchParams.get('category');

    // B-1: Filtrar en la base de datos con ILIKE (no en JS)
    const conditions = [eq(products.isActive, true)];
    if (search) {
      const searchCondition = or(
        ilike(products.name, `%${search}%`),
        ilike(products.sku,  `%${search}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }
    if (categoryId && !isNaN(parseInt(categoryId))) {
      conditions.push(eq(products.categoryId, parseInt(categoryId)));
    }

    const rows = await db
      .select({
        id:           products.id,
        name:         products.name,
        description:  products.description,
        sku:          products.sku,
        categoryId:   products.categoryId,
        categoryName: categories.name,
        price:        products.price,
        stock:        products.stock,
        minStock:     products.minStock,
        unit:         products.unit,
        image:        products.image,
        // Actividad para tarjetas, orden "más vendidos" y "entradas recientes"
        unitsOut30:   sql<number>`COALESCE((SELECT SUM(m.cantidad) FROM movimientos_inventario m WHERE m.producto_id = ${products.id} AND m.tipo = 'salida' AND m.fecha_creacion >= NOW() - INTERVAL '30 days'), 0)::int`,
        unitsOut7:    sql<number>`COALESCE((SELECT SUM(m.cantidad) FROM movimientos_inventario m WHERE m.producto_id = ${products.id} AND m.tipo = 'salida' AND m.fecha_creacion >= NOW() - INTERVAL '7 days'), 0)::int`,
        unitsOutToday: sql<number>`COALESCE((SELECT SUM(m.cantidad) FROM movimientos_inventario m WHERE m.producto_id = ${products.id} AND m.tipo = 'salida' AND m.fecha_creacion >= date_trunc('day', NOW())), 0)::int`,
        lastEntryAt:  sql<string | null>`(SELECT MAX(m.fecha_creacion) FROM movimientos_inventario m WHERE m.producto_id = ${products.id} AND m.tipo = 'entrada')`,
        lastEntryQty: sql<number | null>`(SELECT m.cantidad FROM movimientos_inventario m WHERE m.producto_id = ${products.id} AND m.tipo = 'entrada' ORDER BY m.fecha_creacion DESC LIMIT 1)`,
        createdAt:    products.createdAt,
        updatedAt:    products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(products.name));

    return new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    logger.error({ err, path: '/api/products (GET)' }, 'Error fetching products');
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // A-1: Validación completa de rangos y tipos
    const errors = validateProductBody(body);
    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join('. ') }), { status: 400 });
    }

    const { name, description, sku, categoryId, price, stock, minStock, unit, image } = body;

    const [product] = await db.insert(products).values({
      name,
      description: description ?? null,
      sku:         sku ?? null,
      categoryId:  categoryId ? parseInt(categoryId) : null,
      price:       parseFloat(price).toString(),
      stock:       parseInt(stock),
      minStock:    parseInt(minStock),
      unit:        unit ?? 'pza',
      image:       image || null,
    }).returning();

    // Auditoría
    const userId = locals.userId;
    if (userId) {
      await db.insert(auditLogs).values({
        userId,
        action: 'CREATE',
        entityType: 'products',
        entityId: product.id,
        newValues: JSON.stringify(product),
      });
    }

    // Registrar movimiento de entrada inicial
    if (product.stock > 0) {
      await db.insert(stockMovements).values({
        productId:     product.id,
        type:          'entrada',
        quantity:      product.stock,
        reason:        'Stock inicial al crear producto',
        previousStock: 0,
        newStock:      product.stock,
      });
    }

    // Verificar si hay stock bajo y enviar alerta
    const lowStock = await db
      .select()
      .from(products)
      .where(sql`${products.stock} <= ${products.minStock}`);

    if (lowStock.length > 0) {
      sendLowStockAlert(lowStock.map(p => ({
        id:       p.id,
        name:     p.name,
        sku:      p.sku ?? '',
        stock:    p.stock,
        minStock: p.minStock,
        unit:     p.unit ?? 'pza',
      }))).catch((err) => logger.error({ err }, 'Failed to send low stock alert'));
    }

    return new Response(JSON.stringify(product), { status: 201 });
  } catch (err: any) {
    logger.error({ err, path: '/api/products (POST)' }, 'Error creating product');
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
