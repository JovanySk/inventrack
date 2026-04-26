export function validateProductBody(body: any): string[] {
  const errors: string[] = [];
  const name     = String(body.name ?? '').trim();
  const price    = parseFloat(body.price);
  const stock    = parseInt(body.stock ?? '0');
  const minStock = parseInt(body.minStock ?? '5');

  if (!name || name.length < 2)         errors.push('Nombre muy corto (mínimo 2 caracteres)');
  if (name.length > 200)                errors.push('Nombre demasiado largo (máximo 200 caracteres)');
  if (isNaN(price) || price < 0)        errors.push('Precio inválido (debe ser ≥ 0)');
  if (price > 9_999_999)                errors.push('Precio fuera de rango máximo (9,999,999)');
  if (isNaN(stock) || stock < 0)        errors.push('Stock inválido (debe ser ≥ 0)');
  if (isNaN(minStock) || minStock < 0)  errors.push('Stock mínimo inválido (debe ser ≥ 0)');
  if (body.sku && String(body.sku).length > 50) errors.push('SKU demasiado largo (máximo 50 caracteres)');
  if (body.unit && String(body.unit).length > 20) errors.push('Unidad demasiado larga (máximo 20 caracteres)');
  return errors;
}

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
