-- Agrega la foto del producto (ruta pública bajo /img/productos/).
-- Idempotente: se puede aplicar sobre una base creada con una versión anterior de db/init.sql.
--   docker compose exec -T db psql -U inventario -d inventario_db < db/migrations/0001_producto_imagen.sql
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen VARCHAR(255);
