import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('inventrack-session', { path: '/' });
  cookies.delete('inventrack-user',    { path: '/' });
  cookies.delete('inventrack-email',   { path: '/' }); // Fix A-4: borrar todas las cookies de sesión
  return redirect('/login');
};