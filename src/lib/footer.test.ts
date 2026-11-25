import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { FOOTER_COLUMNS, footerColumnsFor, copyrightLine, CREDIT_LINE } from './footer';

const allLinks = FOOTER_COLUMNS.flatMap(c => c.links);

/** Archivo de src/pages que atiende una ruta, o null si no existe. */
function pageFileFor(pathname: string): string | null {
  const base = pathname === '/' ? 'index' : pathname.replace(/^\//, '').replace(/\/$/, '');
  const candidates = ['.astro', '.ts', '/index.astro', '/index.ts'].map(ext => `src/pages/${base}${ext}`);
  return candidates.find(f => existsSync(f)) ?? null;
}

describe('pie de página', () => {
  it('cada enlace apunta a una página o ruta que existe', () => {
    for (const link of allLinks) {
      const { pathname } = new URL(link.href, 'http://local');
      expect(pageFileFor(pathname), link.href).not.toBeNull();
    }
  });

  it('cada ancla existe en la página de destino', () => {
    for (const link of allLinks) {
      const { pathname, hash } = new URL(link.href, 'http://local');
      if (!hash) continue;
      const source = readFileSync(pageFileFor(pathname)!, 'utf8');
      expect(source.includes(`id="${hash.slice(1)}"`), link.href).toBe(true);
    }
  });

  it('no hay enlaces vacíos ni repetidos', () => {
    const hrefs = allLinks.map(l => l.href);
    expect(hrefs.every(h => h.startsWith('/'))).toBe(true);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('Usuarios solo se muestra a administradores', () => {
    const labels = (role: string) => footerColumnsFor(role).flatMap(c => c.links.map(l => l.label));
    expect(labels('admin')).toContain('Usuarios');
    expect(labels('empleado')).not.toContain('Usuarios');
    expect(labels('demo')).not.toContain('Usuarios');
    expect(labels('demo')).toContain('Cerrar sesión');
  });

  it('textos legales', () => {
    expect(copyrightLine(2026)).toBe('© 2026 InvenTrack. Todos los derechos reservados.');
    expect(CREDIT_LINE).toBe('Sistema de inventario desarrollado por Jovany');
  });
});
