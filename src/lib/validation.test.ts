import { describe, it, expect } from 'vitest';
import { validateProductBody, isValidEmail } from './validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('debería aceptar un email válido', () => {
      expect(isValidEmail('admin@inventrack.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('debería rechazar un email inválido', () => {
      expect(isValidEmail('admin')).toBe(false);
      expect(isValidEmail('admin@.com')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('validateProductBody', () => {
    it('debería retornar un array vacío si el producto es válido', () => {
      const product = { name: 'Teclado Mecánico', price: '1500', stock: '10', minStock: '5' };
      const errors = validateProductBody(product);
      expect(errors).toHaveLength(0);
    });

    it('debería detectar nombres muy cortos', () => {
      const product = { name: 'A', price: '100', stock: '10', minStock: '5' };
      const errors = validateProductBody(product);
      expect(errors).toContain('Nombre muy corto (mínimo 2 caracteres)');
    });

    it('debería detectar precios negativos', () => {
      const product = { name: 'Teclado', price: '-50', stock: '10', minStock: '5' };
      const errors = validateProductBody(product);
      expect(errors).toContain('Precio inválido (debe ser ≥ 0)');
    });

    it('debería detectar precios no numéricos', () => {
      const product = { name: 'Teclado', price: 'gratis', stock: '10', minStock: '5' };
      const errors = validateProductBody(product);
      expect(errors).toContain('Precio inválido (debe ser ≥ 0)');
    });
  });
});
