import type { APIRoute } from 'astro';
import { db } from '@/db';
import { products, stockMovements, auditLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendLowStockAlert } from '@/lib/email';
import { logger } from '@/lib/logger';

import { validateProductBody } from '@/lib/validation';

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);
    const [product] = await db.select().from(products).where(and(eq(products.id, id), eq(products.isActive, true)));
    if (!product) return new Response(JSON.stringify({ error: 'Producto no encontrado o eliminado' }), { status: 404 });
    return new Response(JSON.stringify(product));
  } catch (err: any) {
    logger.error({ err, path: '/api/products/[id] (GET)' }, 'Error fetching product');
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const id   = parseInt(params.id!);
    if (isNaN(id)) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const body = await request.json();

    // A-1: Validar antes de tocar la BD
    const errors = validateProductBody(body);
    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join('. ') }), { status: 400 });
    }

    const { name, description, sku, categoryId, price, stock, minStock, unit, image } = body;

    // Obtener producto anterior para auditoría y movimientos
    const [oldProduct] = await db.select().from(products).where(eq(products.id, id));
    if (!oldProduct) return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });

    const prevStock = oldProduct.stock;
    const newStock  = parseInt(stock);

    const [updated] = await db.update(products).set({
      name,
      description: description ?? null,
      sku:         sku ?? null,
      categoryId:  categoryId ? parseInt(categoryId) : null,
      price:       price?.toString(),
      stock:       newStock,
      minStock:    parseInt(minStock),
      unit:        unit ?? 'pza',
      image:       image || null,
      updatedAt:   new Date(),
    }).where(eq(products.id, id)).returning();

    // Auditoría
    const userId = locals.userId;
    if (userId) {
      await db.insert(auditLogs).values({
        userId,
        action: 'UPDATE',
        entityType: 'products',
        entityId: id,
        oldValues: JSON.stringify(oldProduct),
        newValues: JSON.stringify(updated),
      });
    }

    // Registrar ajuste de stock si cambió
    const stockDiff = newStock - prevStock;
    if (stockDiff !== 0) {
      await db.insert(stockMovements).values({
        productId:     id,
        type:          'ajuste',
        quantity:      Math.abs(stockDiff),
        reason:        `Ajuste manual de stock (${stockDiff > 0 ? '+' : ''}${stockDiff})`,
        previousStock: prevStock,
        newStock:      newStock,
      });
    }

    // Alerta de stock bajo
    if (updated.stock <= updated.minStock) {
      sendLowStockAlert([{
        id:       updated.id,
        name:     updated.name,
        sku:      updated.sku ?? '',
        stock:    updated.stock,
        minStock: updated.minStock,
        unit:     updated.unit ?? 'pza',
      }]).catch((err) => logger.error({ err }, 'Failed to send low stock alert'));
    }

    return new Response(JSON.stringify(updated));
  } catch (err: any) {
    logger.error({ err, path: '/api/products/[id] (PUT)' }, 'Error updating product');
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const [oldProduct] = await db.select().from(products).where(eq(products.id, id));
    if (!oldProduct) return new Response(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });

    // La base de datos tiene un trigger para hacer soft delete automáticamente.
    // Solo ejecutamos DELETE, el trigger intercepta y cambia is_active = false.
    await db.delete(products).where(eq(products.id, id));

    // Auditoría
    const userId = locals.userId;
    if (userId) {
      await db.insert(auditLogs).values({
        userId,
        action: 'DELETE',
        entityType: 'products',
        entityId: id,
        oldValues: JSON.stringify(oldProduct),
        newValues: JSON.stringify({ is_active: false }),
      });
    }

    return new Response(JSON.stringify({ ok: true, id }));
  } catch (err: any) {
    logger.error({ err, path: '/api/products/[id] (DELETE)' }, 'Error deleting product');
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
