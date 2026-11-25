import type { APIRoute } from 'astro';
import { db } from '@/db';
import { products, categories, stockMovements } from '@/db/schema';
import { eq, sql, count, desc, and } from 'drizzle-orm';
import { getUsdMxnRate } from '@/lib/exchangeRate';

export const GET: APIRoute = async () => {
  try {
    const active = eq(products.isActive, true);

    // ── Estadisticas generales (solo productos activos) ─────────────
    const [totals] = await db
      .select({
        totalProducts: count(products.id),
        totalValue:    sql<number>`COALESCE(SUM(${products.price} * ${products.stock}), 0)`,
        totalUnits:    sql<number>`COALESCE(SUM(${products.stock}), 0)`,
        lowStockCount: sql<number>`COUNT(CASE WHEN ${products.stock} <= ${products.minStock} THEN 1 END)`,
        outOfStock:    sql<number>`COUNT(CASE WHEN ${products.stock} = 0 THEN 1 END)`,
      })
      .from(products)
      .where(active);

    // ── Productos y valor por categoria ─────────────────────────────
    const byCategory = await db
      .select({
        categoryName: categories.name,
        count:        count(products.id),
        value:        sql<number>`COALESCE(SUM(${products.price} * ${products.stock}), 0)`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(active)
      .groupBy(categories.name)
      .orderBy(desc(sql`COALESCE(SUM(${products.price} * ${products.stock}), 0)`));

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
      .where(and(active, sql`${products.stock} <= ${products.minStock}`))
      .orderBy(sql`${products.stock}::float / NULLIF(${products.minStock}, 0)`, products.name);

    // ── Ultimos movimientos ─────────────────────────────────────────
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

    // ── Serie diaria de los ultimos 30 dias (unidades) ──────────────
    const daily = await db.execute(sql`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
             COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.cantidad END), 0)::int AS entradas,
             COALESCE(SUM(CASE WHEN m.tipo = 'salida'  THEN m.cantidad END), 0)::int AS salidas,
             COUNT(m.id)::int AS movimientos
      FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') AS d(day)
      LEFT JOIN movimientos_inventario m
        ON m.fecha_creacion >= d.day AND m.fecha_creacion < d.day + INTERVAL '1 day'
      GROUP BY d.day
      ORDER BY d.day
    `);

    const dailyRows = (daily as unknown as Array<{ day: string; entradas: number; salidas: number; movimientos: number }>)
      .map(r => ({ day: r.day, entradas: Number(r.entradas), salidas: Number(r.salidas), movimientos: Number(r.movimientos) }));
    const last30 = dailyRows.reduce(
      (acc, r) => ({ entradas: acc.entradas + r.entradas, salidas: acc.salidas + r.salidas, movimientos: acc.movimientos + r.movimientos }),
      { entradas: 0, salidas: 0, movimientos: 0 },
    );

    // ── Tipo de cambio USD/MXN ──────────────────────────────────────
    const exchangeRate = await getUsdMxnRate();

    return new Response(
      JSON.stringify({
        totals: {
          totalProducts: Number(totals.totalProducts),
          totalUnits:    Number(totals.totalUnits),
          lowStockCount: Number(totals.lowStockCount),
          outOfStock:    Number(totals.outOfStock),
          totalValue:    Number(totals.totalValue),
          totalValueUsd: exchangeRate ? (Number(totals.totalValue) / exchangeRate).toFixed(2) : null,
          exchangeRate,
        },
        byCategory: byCategory.map(c => ({
          ...c,
          count: Number(c.count),
          value: Number(c.value),
        })),
        lowStock,
        recentMovements,
        daily: dailyRows,
        last30,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
