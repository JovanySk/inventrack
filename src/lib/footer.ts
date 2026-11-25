// Pie de página: columnas de enlaces a páginas reales del sistema.
// footer.test.ts comprueba que cada href apunte a un archivo de src/pages
// y que cada ancla (#...) exista en la página de destino.

export type FooterLink = {
  href: string;
  label: string;
  /** Solo se muestra a administradores (la ruta exige permisos de usuarios) */
  adminOnly?: boolean;
  /** Descarga directa de archivo */
  download?: boolean;
};

export type FooterColumn = { title: string; links: FooterLink[] };

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Inventario',
    links: [
      { href: '/',            label: 'Resumen' },
      { href: '/productos',   label: 'Productos' },
      { href: '/categorias',  label: 'Pasillos' },
      { href: '/movimientos', label: 'Movimientos' },
      { href: '/alertas',     label: 'Alertas' },
    ],
  },
  {
    title: 'Herramientas',
    links: [
      { href: '/productos?filtro=bajo',     label: 'Productos por surtir' },
      { href: '/productos?filtro=agotados', label: 'Productos agotados' },
      { href: '/xml',                       label: 'Importar XML' },
      { href: '/api/xml',                   label: 'Descargar inventario (XML)', download: true },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { href: '/usuarios',   label: 'Usuarios', adminOnly: true },
      { href: '/ayuda#roles', label: 'Roles y permisos' },
      { href: '/api/logout', label: 'Cerrar sesión' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { href: '/ayuda#guia',      label: 'Guía rápida' },
      { href: '/ayuda#preguntas', label: 'Preguntas frecuentes' },
      { href: '/ayuda#atajos',    label: 'Atajos de teclado' },
    ],
  },
];

export const SOCIAL_NETWORKS = ['Facebook', 'Instagram', 'TikTok', 'WhatsApp'] as const;

/** Columnas visibles para un rol: quita los enlaces exclusivos de administrador. */
export function footerColumnsFor(role: string): FooterColumn[] {
  return FOOTER_COLUMNS
    .map(col => ({ ...col, links: col.links.filter(l => !l.adminOnly || role === 'admin') }))
    .filter(col => col.links.length > 0);
}

export function copyrightLine(year = new Date().getFullYear()): string {
  return `© ${year} InvenTrack. Todos los derechos reservados.`;
}

export const CREDIT_LINE = 'Sistema de inventario desarrollado por Jovany';
