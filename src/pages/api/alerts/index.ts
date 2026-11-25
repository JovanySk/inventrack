import type { APIRoute } from 'astro';
import { db } from '@/db';
import { products } from '@/db/schema';
import { sql, and, eq } from 'drizzle-orm';
import { sendLowStockAlert, getEmailMode, getAlertRecipient } from '@/lib/email';

// POST /api/alerts/check → revisa stock bajo y envía email
export const POST: APIRoute = async () => {
  try {
    const lowStock = await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} <= ${products.minStock}`));

    if (lowStock.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: 'Todos los productos tienen stock suficiente', count: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sent = await sendLowStockAlert(
      lowStock.map(p => ({
        id:       p.id,
        name:     p.name,
        sku:      p.sku ?? '',
        stock:    p.stock,
        minStock: p.minStock,
        unit:     p.unit ?? 'pza',
      }))
    );

    return new Response(
      JSON.stringify({
        ok:      true,
        sent,
        count:   lowStock.length,
        mode:    getEmailMode(),
        recipient: getAlertRecipient(),
        message: !sent
          ? 'No se pudo enviar la alerta. Revisa la configuración de correo.'
          : getEmailMode() === 'log'
            ? `Modo registro: alerta de ${lowStock.length} productos escrita en la consola del servidor. No se envió ningún correo.`
            : `Alerta enviada a ${getAlertRecipient()}: ${lowStock.length} productos con stock bajo`,
        products: lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stock, minStock: p.minStock })),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
