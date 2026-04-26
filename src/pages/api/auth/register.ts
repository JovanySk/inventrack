import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { sendConfirmationEmail } from '../../../lib/email';
import bcrypt from 'bcryptjs';

// Generar token aleatorio
function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    for (const byte of array) {
        token += chars[byte % chars.length];
    }
    return token;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // ─── Validaciones ───
        if (!name || !email || !password) {
            return new Response(JSON.stringify({
                error: 'Todos los campos son obligatorios'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (name.trim().length < 2 || name.trim().length > 100) {
            return new Response(JSON.stringify({
                error: 'El nombre debe tener entre 2 y 100 caracteres'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({
                error: 'Correo electrónico inválido'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (password.length < 8) {
            return new Response(JSON.stringify({
                error: 'La contraseña debe tener al menos 8 caracteres'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // ─── Verificar email duplicado ───
        const existing = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.email, email.toLowerCase().trim()))
            .limit(1);

        if (existing.length > 0) {
            return new Response(JSON.stringify({
                error: 'Este correo ya está registrado'
            }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }

        // ─── Crear usuario (dentro de una transacción lógica para manejar el error de email) ───
        const passwordHash = await bcrypt.hash(password, 12);
        const confirmationToken = generateToken();
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        let newUser;
        try {
            const [insertedUser] = await db.insert(users).values({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                passwordHash,
                role: 'empleado',
                accountStatus: 'pendiente',
                emailConfirmed: false,
                confirmationToken,
                tokenExpiresAt,
                isActive: false,
            }).returning({ id: users.id, name: users.name, email: users.email });
            
            newUser = insertedUser;
        } catch (dbError: any) {
            console.error('[Register] ❌ Error DB:', dbError);
            return new Response(JSON.stringify({ error: 'Error al crear el usuario en la base de datos' }), { status: 500 });
        }

        // ─── Enviar correo de confirmación ───
        const emailSent = await sendConfirmationEmail(newUser.email, newUser.name, confirmationToken);

        if (!emailSent) {
            // Si el email falla, borramos al usuario para evitar "usuarios fantasma"
            await db.delete(users).where(eq(users.id, newUser.id));
            console.error(`[Register] ❌ Falló el envío de email a ${newUser.email}. Usuario eliminado.`);
            
            return new Response(JSON.stringify({
                error: 'No se pudo enviar el correo de confirmación. Por favor, verifica que tu correo sea válido e intenta de nuevo.'
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        console.log(`[Register] ✅ Usuario creado y email enviado: ${newUser.email}`);

        return new Response(JSON.stringify({
            success: true,
            message: '¡Cuenta creada! Hemos enviado un enlace de confirmación a tu correo.',
        }), { status: 201, headers: { 'Content-Type': 'application/json' } });


    } catch (error: any) {
        console.error('[Register] ❌ Error:', error);
        return new Response(JSON.stringify({
            error: 'Error interno del servidor. Intenta de nuevo.'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};