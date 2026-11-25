import { defineMiddleware } from 'astro:middleware';
import { logger } from '@/lib/logger';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_dev_key_only');

// Rutas de página que NO requieren autenticación
const PUBLIC_PAGES = ['/login', '/confirm'];

// Rutas de API que NO requieren autenticación
const PUBLIC_API = ['/api/forgot-password', '/api/auth/register', '/api/auth/confirm'];

// ── Rate Limiter en Memoria ──
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
// En desarrollo Vite sirve cada módulo como petición aparte: se usa un límite mayor.
const MAX_REQUESTS = import.meta.env.DEV ? 5000 : 150;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitCache.get(ip);

  if (rateLimitCache.size > 10000) rateLimitCache.clear();

  if (!record || record.resetTime < now) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (record.count >= MAX_REQUESTS) {
    return true;
  }
  record.count++;
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const ip = context.clientAddress || '127.0.0.1';

  // Assets estáticos
  if (pathname.startsWith('/_astro/') || pathname.includes('.')) {
    return next();
  }

  // Rate Limit
  if (isRateLimited(ip)) {
    logger.warn(`Rate limit excedido por IP: ${ip} en la ruta ${pathname}`);
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Demasiadas peticiones. Intente más tarde.' }), {
        status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '900' }
      });
    }
    return new Response('429 Too Many Requests', { status: 429 });
  }

  // Páginas públicas
  if (PUBLIC_PAGES.includes(pathname)) {
    return next();
  }

  // APIs públicas
  if (PUBLIC_API.includes(pathname)) {
    return next();
  }

  // Verificar sesión JWT
  const token = context.cookies.get('inventrack-token')?.value;
  let payload = null;

  if (token) {
    try {
      const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET);
      payload = jwtPayload;
    } catch (err) {
      logger.warn(`JWT inválido o expirado de la IP: ${ip}`);
    }
  }

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'No autenticado. Token inválido o expirado.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/login');
  }

  const role = (payload.role as string) || 'demo';
  const permissions = (payload.permissions as string[]) || [];

  context.locals.userId = payload.id as number;
  context.locals.userRole = role;
  context.locals.userName = payload.name as string;
  context.locals.permissions = permissions;

  // ── Autorización ABAC ──
  const accessDenied = () => new Response(JSON.stringify({ error: 'Acceso denegado: permisos insuficientes' }), {
    status: 403, headers: { 'Content-Type': 'application/json' }
  });

  if (pathname.startsWith('/usuarios') && !permissions.includes('user:manage') && !permissions.includes('user:read')) {
    return context.redirect('/');
  }

  if (pathname.startsWith('/api/')) {
    const method = context.request.method;

    if (pathname.includes('/products')) {
      if (method === 'POST' && !permissions.includes('product:create')) return accessDenied();
      if (method === 'PUT' && !permissions.includes('product:update')) return accessDenied();
      if (method === 'DELETE' && !permissions.includes('product:delete')) return accessDenied();
      if (method === 'GET' && !permissions.includes('product:read')) return accessDenied();
    }

    if (pathname.includes('/movements')) {
      if (method === 'POST' && !permissions.includes('movement:create')) return accessDenied();
      if (method === 'GET' && !permissions.includes('movement:read')) return accessDenied();
    }

    if (pathname.includes('/xml')) {
      if (method === 'POST' && !permissions.includes('product:create')) return accessDenied();
      if (method === 'GET' && !permissions.includes('product:read')) return accessDenied();
    }
  }

  const response = await next();

  // ── Security Headers ──
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;");

  return response;
});