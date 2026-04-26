import type { APIRoute } from 'astro';
import { db } from '@/db';
import { products, categories, stockMovements } from '@/db/schema';
import { eq, sql, count, desc } from 'drizzle-orm';
import { getUsdMxnRate } from '@/lib/exchangeRate';

export const GET: APIRoute = async () => {
  try {
    // ── Estadísticas generales ──────────────────────────────────────
    const [totals] = await db
      .select({
        totalProducts: count(products.id),
        totalValue:    sql<number>`COALESCE(SUM(${products.price} * ${products.stock}), 0)`,
        lowStockCount: sql<number>`COUNT(CASE WHEN ${products.stock} <= ${products.minStock} THEN 1 END)`,
        outOfStock:    sql<number>`COUNT(CASE WHEN ${products.stock} = 0 THEN 1 END)`,
      })
      .from(products);

    // ── Productos por categoría ─────────────────────────────────────
    const byCategory = await db
      .select({
        categoryName: categories.name,
        count:        count(products.id),
        value:        sql<number>`COALESCE(SUM(${products.price} * ${products.stock}), 0)`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .groupBy(categories.name)
      .orderBy(desc(count(products.id)));

    // ── Productos con stock bajo ────────────────────────────────────
    const lowStock = await db
      .select({
        id:       products.id,
        name:     products.name,
        sku:      products.sku,
        stock:    products.stock,
        minStock: products.minStock,
        unit:     products.unit,
      })
      .from(products)
      .where(sql`${products.stock} <= ${products.minStock}`)
      .orderBy(products.stock);

    // ── Últimos movimientos ─────────────────────────────────────────
    const recentMovements = await db
      .select({
        id:          stockMovements.id,
        productName: products.name,
        type:        stockMovements.type,
        quantity:    stockMovements.quantity,
        newStock:    stockMovements.newStock,
        reason:      stockMovements.reason,
        createdAt:   stockMovements.createdAt,
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .orderBy(desc(stockMovements.createdAt))
      .limit(10);

    // ── Tipo de cambio USD/MXN ──────────────────────────────────────
    const exchangeRate = await getUsdMxnRate();

    return new Response(
      JSON.stringify({
        totals: {
          ...totals,
          totalValue:     Number(totals.totalValue),
          totalValueUsd:  exchangeRate ? (Number(totals.totalValue) / exchangeRate).toFixed(2) : null,
          exchangeRate,
        },
        byCategory: byCategory.map(c => ({
          ...c,
          count: Number(c.count),
          value: Number(c.value),
        })),
        lowStock,
        recentMovements,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
