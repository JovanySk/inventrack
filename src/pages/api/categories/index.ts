import type { APIRoute } from 'astro';
import { db } from '@/db';
import { categories, products } from '@/db/schema';
import { eq, count, asc } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    const rows = await db
      .select({
        id:          categories.id,
        name:        categories.name,
        description: categories.description,
        createdAt:   categories.createdAt,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.name));

    return new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, description } = await request.json();
    if (!name) return new Response(JSON.stringify({ error: 'El nombre es requerido' }), { status: 400 });

    const [cat] = await db.insert(categories).values({ name, description }).returning();
    return new Response(JSON.stringify(cat), { status: 201 });
  } catch (err: any) {
    if (err.message.includes('unique')) {
      return new Response(JSON.stringify({ error: 'Ya existe una categoría con ese nombre' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const id = parseInt(url.searchParams.get('id') ?? '0');
    if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });

    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!deleted) return new Response(JSON.stringify({ error: 'Categoría no encontrada' }), { status: 404 });

    return new Response(JSON.stringify({ ok: true }));
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
