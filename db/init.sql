-- =====================================================
-- Sistema de Gestión de Inventario
-- Esquema de base de datos + datos iniciales
-- =====================================================

-- Extensión para hashing de contraseñas y validación de texto
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Enum para tipo de movimiento
DO $$ BEGIN
  CREATE TYPE tipo_movimiento AS ENUM ('entrada', 'salida', 'ajuste');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- RBAC / ABAC (Roles y Permisos)
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  nombre VARCHAR(50) PRIMARY KEY,
  descripcion VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS permisos (
  id VARCHAR(50) PRIMARY KEY,
  descripcion VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS permisos_rol (
  nombre_rol VARCHAR(50) REFERENCES roles(nombre) ON DELETE CASCADE,
  id_permiso VARCHAR(50) REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (nombre_rol, id_permiso)
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  correo_electronico CITEXT NOT NULL UNIQUE CHECK (correo_electronico ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
  nombre        VARCHAR(100) NOT NULL,
  hash_contrasena VARCHAR(255) NOT NULL,
  rol           VARCHAR(50) NOT NULL DEFAULT 'empleado' REFERENCES roles(nombre),
  esta_activo   BOOLEAN DEFAULT TRUE,
  intentos_fallidos_login INTEGER DEFAULT 0,
  bloqueado_hasta TIMESTAMP WITH TIME ZONE,
  secreto_2fa   VARCHAR(255),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Columnas para confirmación de cuenta
  estado_cuenta VARCHAR(20) DEFAULT 'activo',
  correo_confirmado BOOLEAN DEFAULT true,
  token_confirmacion VARCHAR(255),
  fecha_expiracion_token TIMESTAMPTZ
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL CHECK (length(trim(nombre)) >= 2),
  descripcion VARCHAR(1000),
  codigo_sku  VARCHAR(50) UNIQUE,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  precio      DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  existencia  INTEGER NOT NULL DEFAULT 0        CHECK (existencia >= 0),
  existencia_minima INTEGER NOT NULL DEFAULT 5 CHECK (existencia_minima >= 0),
  unidad      VARCHAR(20) DEFAULT 'pza',
  esta_activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos de stock
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id              SERIAL PRIMARY KEY,
  producto_id     INTEGER REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
  tipo            tipo_movimiento NOT NULL,
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  motivo          TEXT,
  existencia_anterior INTEGER NOT NULL CHECK (existencia_anterior >= 0),
  existencia_nueva INTEGER NOT NULL CHECK (existencia_nueva >= 0),
  fecha_creacion  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA DE AUDITORÍA (Logs Empresariales)
-- =====================================================
CREATE TABLE IF NOT EXISTS registros_auditoria (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  accion      VARCHAR(50) NOT NULL, -- ej: 'CREATE', 'UPDATE', 'DELETE'
  tipo_entidad VARCHAR(50) NOT NULL, -- ej: 'productos', 'usuarios'
  entidad_id  INTEGER,
  valores_antiguos JSONB,
  valores_nuevos JSONB,
  direccion_ip INET,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON registros_auditoria(tipo_entidad, entidad_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha_creacion ON movimientos_inventario(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_productos_existencia ON productos(existencia);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_productos_fecha_actualizacion ON productos;
CREATE TRIGGER trigger_productos_fecha_actualizacion
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- =====================================================
-- M-2: TRIGGER para prevenir stock negativo
-- =====================================================
CREATE OR REPLACE FUNCTION validar_existencia_no_negativa()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo aplica a movimientos de salida
  IF NEW.tipo = 'salida' THEN
    IF NEW.existencia_nueva < 0 THEN
      RAISE EXCEPTION
        'Stock insuficiente para el producto ID %. Stock actual: %, cantidad solicitada: %',
        NEW.producto_id, NEW.existencia_anterior, NEW.cantidad;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_movimiento_existencia ON movimientos_inventario;
CREATE TRIGGER trigger_validar_movimiento_existencia
  BEFORE INSERT ON movimientos_inventario
  FOR EACH ROW
  EXECUTE FUNCTION validar_existencia_no_negativa();

-- =====================================================
-- TRIGGERS PARA SOFT DELETES
-- =====================================================
CREATE OR REPLACE FUNCTION prevenir_borrado_fisico() RETURNS TRIGGER AS $$
BEGIN
  -- Evitar que la tabla se borre si hacemos soft delete
  IF TG_TABLE_NAME = 'productos' THEN
    UPDATE productos SET esta_activo = false, fecha_actualizacion = NOW() WHERE id = OLD.id;
  ELSIF TG_TABLE_NAME = 'usuarios' THEN
    UPDATE usuarios SET esta_activo = false WHERE id = OLD.id;
  END IF;
  RETURN NULL; -- Cancela el DELETE real
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_soft_delete_productos ON productos;
CREATE TRIGGER trg_soft_delete_productos
  BEFORE DELETE ON productos
  FOR EACH ROW EXECUTE FUNCTION prevenir_borrado_fisico();

DROP TRIGGER IF EXISTS trg_soft_delete_usuarios ON usuarios;
CREATE TRIGGER trg_soft_delete_usuarios
  BEFORE DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION prevenir_borrado_fisico();

-- =====================================================
-- DATOS DE PRUEBA Y PERMISOS
-- =====================================================

INSERT INTO roles (nombre, descripcion) VALUES
  ('admin', 'Administrador con acceso total'),
  ('empleado', 'Empleado de almacén'),
  ('demo', 'Usuario de solo lectura')
ON CONFLICT DO NOTHING;

INSERT INTO permisos (id, descripcion) VALUES
  ('product:read', 'Ver productos'),
  ('product:create', 'Crear productos'),
  ('product:update', 'Editar productos'),
  ('product:delete', 'Eliminar productos'),
  ('movement:read', 'Ver movimientos'),
  ('movement:create', 'Registrar movimientos'),
  ('user:read', 'Ver usuarios'),
  ('user:manage', 'Gestionar usuarios y roles')
ON CONFLICT DO NOTHING;

INSERT INTO permisos_rol (nombre_rol, id_permiso) VALUES
  -- Admin (todo)
  ('admin', 'product:read'), ('admin', 'product:create'), ('admin', 'product:update'), ('admin', 'product:delete'),
  ('admin', 'movement:read'), ('admin', 'movement:create'),
  ('admin', 'user:read'), ('admin', 'user:manage'),
  -- Empleado (crear/ver/editar, NO borrar, NO usuarios)
  ('empleado', 'product:read'), ('empleado', 'product:create'), ('empleado', 'product:update'),
  ('empleado', 'movement:read'), ('empleado', 'movement:create'),
  -- Demo (solo lectura)
  ('demo', 'product:read'), ('demo', 'movement:read')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (correo_electronico, nombre, hash_contrasena, rol) VALUES
  ('admin@inventrack.com',    'Administrador', crypt('admin123', gen_salt('bf', 10)), 'admin'),
  ('equipo3@inventrack.com',  'Equipo 3',      crypt('equipo123', gen_salt('bf', 10)), 'admin'),
  ('empleado@inventrack.com', 'Empleado',      crypt('empleado123', gen_salt('bf', 10)), 'empleado'),
  ('demo@inventrack.com',     'Demo',          crypt('demo123', gen_salt('bf', 10)), 'demo')
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Electrónica',  'Dispositivos y componentes electrónicos'),
  ('Herramientas', 'Herramientas manuales y eléctricas'),
  ('Papelería',    'Artículos de oficina y papelería'),
  ('Limpieza',     'Productos de limpieza e higiene'),
  ('Cómputo',      'Accesorios y periféricos de computadora')
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, codigo_sku, categoria_id, precio, existencia, existencia_minima, unidad) VALUES
  ('Laptop Dell XPS 13',     'Laptop ultradelgada 13" Intel Core i7', 'ELEC-001', 1, 15999.99,  8,  3, 'pza'),
  ('Monitor LG 24"',         'Monitor Full HD IPS 75Hz',               'ELEC-002', 1,  4500.00, 12,  4, 'pza'),
  ('Teclado Mecánico RGB',   'Teclado gaming switches azules',         'COMP-001', 5,  1200.00,  3,  5, 'pza'),
  ('Mouse Inalámbrico',      'Mouse ergonómico 2.4GHz',                'COMP-002', 5,   450.00, 18,  6, 'pza'),
  ('Desarmador de Precisión','Set 12 puntas magnetizadas',             'HERR-001', 2,   350.00, 20,  8, 'set'),
  ('Taladro Percutor 550W',  'Taladro con 20 accesorios incluidos',    'HERR-002', 2,  1800.00,  5,  3, 'pza'),
  ('Resma Papel A4',         'Papel bond 75g 500 hojas',               'PAP-001',  3,   120.00,  2, 10, 'resma'),
  ('Bolígrafos Bic x12',     'Caja 12 bolígrafos azules punto medio',  'PAP-002',  3,    45.00, 30, 15, 'caja'),
  ('Cloro Concentrado 1L',   'Cloro desinfectante multiusos',          'LIMP-001', 4,    28.00,  4, 10, 'pza'),
  ('Jabón Líquido 500ml',    'Jabón antibacterial con aloe vera',      'LIMP-002', 4,    65.00, 15,  8, 'pza'),
  ('Audífonos Bluetooth',    'Audífonos over-ear cancelación de ruido','COMP-003', 5,  2200.00,  7,  4, 'pza'),
  ('Cable HDMI 2m',          'Cable HDMI 2.0 4K 60Hz',                 'COMP-004', 5,    89.00, 25, 10, 'pza')
ON CONFLICT DO NOTHING;

-- Movimientos iniciales de ejemplo
INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, existencia_anterior, existencia_nueva) VALUES
  (1, 'entrada', 10, 'Compra inicial proveedor Dell',      0,  10),
  (1, 'salida',   2, 'Venta a cliente corporativo',       10,   8),
  (6, 'entrada',  5, 'Reabastecimiento mensual',           0,   5),
  (7, 'entrada', 10, 'Compra de papelería trimestral',     0,  10),
  (7, 'salida',   8, 'Consumo interno oficina',           10,   2),
  (9, 'entrada', 10, 'Compra productos limpieza',          0,  10),
  (9, 'salida',   6, 'Distribución a sucursales',         10,   4)
ON CONFLICT DO NOTHING;