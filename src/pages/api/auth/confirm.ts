import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
    try {
        const url = new URL(context.request.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return context.redirect('/confirm?error=Token+inválido');
        }

        // Buscar usuario con token válido y no expirado
        const [user] = await db
            .select()
            .from(users)
            .where(
                and(
                    eq(users.confirmationToken, token),
                    gt(users.tokenExpiresAt, new Date())
                )
            )
            .limit(1);

        if (!user) {
            return context.redirect('/confirm?error=Token+inválido+o+expirado');
        }

        // Ya estaba confirmado
        if (user.emailConfirmed) {
            return context.redirect('/confirm?success=true&name=' + encodeURIComponent(user.name) + '&already=true');
        }

        // Confirmar email y activar cuenta
        await db.update(users).set({
            emailConfirmed: true,
            accountStatus: 'activo',
            isActive: true,
            confirmationToken: null,
            tokenExpiresAt: null,
            updatedAt: new Date(),
        }).where(eq(users.id, user.id));

        console.log(`[Confirm] ✅ Email confirmado: ${user.email} (ID: ${user.id})`);

        return context.redirect('/confirm?success=true&name=' + encodeURIComponent(user.name));

    } catch (error) {
        console.error('[Confirm] ❌ Error:', error);
        return context.redirect('/confirm?error=Error+al+confirmar+la+cuenta');
    }
};