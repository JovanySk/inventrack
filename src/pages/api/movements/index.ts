import type { APIRoute } from 'astro';
import { db } from '@/db';
import { products, stockMovements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendLowStockAlert } from '@/lib/email';
import { logger } from '@/lib/logger';

export const GET: APIRoute = async ({ url }) => {
  try {
    const productId = url.searchParams.get('productId');
    const limit     = parseInt(url.searchParams.get('limit') ?? '50');

    let query = db
      .select({
        id:            stockMovements.id,
        productId:     stockMovements.productId,
        productName:   products.name,
        type:          stockMovements.type,
        quantity:      stockMovements.quantity,
        reason:        stockMovements.reason,
        previousStock: stockMovements.previousStock,
        newStock:      stockMovements.newStock,
        createdAt:     stockMovements.createdAt,
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit);

    const rows = productId
      ? await db
          .select({
            id:            stockMovements.id,
            productId:     stockMovements.productId,
            productName:   products.name,
            type:          stockMovements.type,
            quantity:      stockMovements.quantity,
            reason:        stockMovements.reason,
            previousStock: stockMovements.previousStock,
            newStock:      stockMovements.newStock,
            createdAt:     stockMovements.createdAt,
          })
          .from(stockMovements)
          .leftJoin(products, eq(stockMovements.productId, products.id))
          .where(eq(stockMovements.productId, parseInt(productId)))
          .orderBy(desc(stockMovements.createdAt))
          .limit(limit)
      : await query;

    return new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    logger.error({ err, path: '/api/movements (GET)' }, 'Error fetching movements');
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { productId, type, quantity, reason } = await request.json();

    // A-1/A-2: Validaciones completas antes de cualquier operación en BD
    const VALID_TYPES = ['entrada', 'salida', 'ajuste'];
    if (!productId || !type || !quantity) {
      return new Response(
        JSON.stringify({ error: 'productId, type y quantity son requeridos' }),
        { status: 400 }
      );
    }
    if (!VALID_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Tipo inválido. Debe ser: ${VALID_TYPES.join(', ')}` }),
        { status: 400 }
      );
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return new Response(
        JSON.stringify({ error: 'Cantidad inválida (debe ser un entero positivo)' }),
        { status: 400 }
      );
    }
    if (qty > 999_999) {
      return new Response(
        JSON.stringify({ error: 'Cantidad fuera de rango máximo' }),
        { status: 400 }
      );
    }

    // A-2: Operación atómica con transacción para evitar race conditions
    const result = await db.transaction(async (tx) => {
      // Leer el producto DENTRO de la transacción (datos frescos)
      const [product] = await tx
        .select({
          id: products.id, name: products.name,
          stock: products.stock, minStock: products.minStock,
          sku: products.sku, unit: products.unit,
        })
        .from(products)
        .where(eq(products.id, parseInt(productId)));

      if (!product) throw new Error('PRODUCT_NOT_FOUND');

      const prevStock = product.stock;
      let newStock    = prevStock;

      if (type === 'entrada') newStock = prevStock + qty;
      if (type === 'salida')  newStock = Math.max(0, prevStock - qty);
      if (type === 'ajuste')  newStock = qty;

      // Actualizar stock y registrar movimiento en la misma transacción
      await tx.update(products)
        .set({ stock: newStock })
        .where(eq(products.id, product.id));

      const [movement] = await tx.insert(stockMovements).values({
        productId:     product.id,
        type,
        quantity:      qty,
        reason:        reason || null,
        previousStock: prevStock,
        newStock,
      }).returning();

      return { movement, newStock, product };
    });

    // Alerta de stock bajo (fuera de la transacción para no bloquearla)
    if (result.newStock <= result.product.minStock) {
      sendLowStockAlert([{
        id:       result.product.id,
        name:     result.product.name,
        sku:      result.product.sku ?? '',
        stock:    result.newStock,
        minStock: result.product.minStock,
        unit:     result.product.unit ?? 'pza',
      }]).catch((err) => logger.error({ err }, 'Failed to send low stock alert'));
    }

    return new Response(JSON.stringify({ movement: result.movement, newStock: result.newStock }), { status: 201 });
  } catch (err: any) {
    logger.error({ err, path: '/api/movements (POST)' }, 'Error processing movement');
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
