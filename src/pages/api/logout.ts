import type { APIRoute } from 'astro';

// Borra el JWT y las cookies de interfaz que crea el login.
const SESSION_COOKIES = ['inventrack-token', 'inventrack-user', 'inventrack-email', 'inventrack-role', 'inventrack-session'];

export const GET: APIRoute = async ({ cookies, redirect }) => {
  for (const name of SESSION_COOKIES) cookies.delete(name, { path: '/' });
  return redirect('/login');
};
