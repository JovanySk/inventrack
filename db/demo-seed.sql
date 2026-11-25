-- =====================================================
-- InvenTrack - Datos de demostracion (ficticios)
-- Tienda de ferreteria y articulos de oficina "Ferreteria y Papeleria del Centro"
--
-- Reemplaza categorias, productos y movimientos con un catalogo
-- realista y genera movimientos de los ultimos 30 dias.
-- No toca usuarios, roles ni permisos (los crea db/init.sql).
--
-- Uso (con el contenedor de Postgres levantado):
--   docker compose exec -T db psql -U inventario -d inventario_db < db/demo-seed.sql
-- =====================================================

BEGIN;

-- Columna de foto (por si la base se creó antes de agregarla; ver db/migrations/0001_producto_imagen.sql)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen VARCHAR(255);

TRUNCATE movimientos_inventario, productos, categorias RESTART IDENTITY CASCADE;

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Herramientas manuales',   'Martillos, desarmadores, llaves y pinzas'),
  ('Herramientas eléctricas', 'Taladros, esmeriladoras y accesorios'),
  ('Tornillería y fijación',  'Tornillos, taquetes, clavos y anclas'),
  ('Pinturas y adhesivos',    'Pintura vinílica, esmaltes, selladores y pegamentos'),
  ('Papelería',               'Papel, cuadernos, plumas y archivo'),
  ('Cómputo y accesorios',    'Periféricos, cables y almacenamiento'),
  ('Limpieza',                'Productos de limpieza e higiene para oficina');

-- stock se recalcula abajo a partir de los movimientos
INSERT INTO productos (nombre, descripcion, codigo_sku, categoria_id, precio, existencia, existencia_minima, unidad) VALUES
  -- Pasillo 1: Herramientas manuales
  ('Martillo de una 16 oz',            'Mango de fibra de vidrio antivibración',     'HM-0101', 1,  289.00, 0, 6,  'pza'),
  ('Juego de desarmadores 8 pzs',      'Puntas planas y Phillips, mango bimaterial',  'HM-0102', 1,  349.00, 0, 5,  'set'),
  ('Llave ajustable 10"',              'Acero cromo vanadio',                         'HM-0103', 1,  259.00, 0, 4,  'pza'),
  ('Pinza de electricista 8"',         'Con pelacables y aislamiento 1000 V',         'HM-0104', 1,  315.00, 0, 4,  'pza'),
  ('Flexómetro 5 m',                   'Cinta de acero con freno y clip',             'HM-0105', 1,  145.00, 0, 10, 'pza'),
  ('Nivel torpedo 9"',                 'Aluminio, 3 burbujas y base magnética',       'HM-0106', 1,  189.00, 0, 5,  'pza'),
  ('Serrucho de carpintero 20"',       'Diente templado y mango ergonómico',          'HM-0107', 1,  229.00, 0, 4,  'pza'),
  ('Pinza de presión 10"',             'Mordaza curva de acero al carbono',           'HM-0108', 1,  209.00, 0, 4,  'pza'),
  -- Pasillo 2: Herramientas eléctricas
  ('Taladro percutor 1/2" 650 W',      'Velocidad variable y reversa',                'HE-0201', 2, 1849.00, 0, 3,  'pza'),
  ('Esmeriladora angular 4 1/2"',      '850 W, incluye guarda y llave',               'HE-0202', 2, 1290.00, 0, 2,  'pza'),
  ('Juego de brocas para metal 13 pzs','Acero HSS en estuche',                        'HE-0203', 2,  239.00, 0, 6,  'set'),
  ('Disco de corte metal 4 1/2"',      'Espesor 1 mm',                                'HE-0204', 2,   32.00, 0, 40, 'pza'),
  ('Sierra circular 7 1/4" 1400 W',    'Disco de 24 dientes, guía paralela',          'HE-0205', 2, 2490.00, 0, 3,  'pza'),
  ('Rotomartillo SDS Plus 800 W',      '3 funciones, incluye maletín',                'HE-0206', 2, 2690.00, 0, 2,  'pza'),
  ('Lijadora roto-orbital 5" 280 W',   'Velocidad variable, con bolsa recolectora',         'HE-0207', 2,  899.00, 0, 3,  'pza'),
  ('Pistola de calor 1500 W',          'Dos temperaturas, para decapar y termoencoger','HE-0208', 2,  649.00, 0, 3,  'pza'),
  -- Pasillo 3: Tornillería y fijación
  ('Tornillo para tablaroca 1" (100)', 'Punta broca, cabeza de trompeta',             'TF-0301', 3,   68.00, 0, 25, 'caja'),
  ('Taquete plástico 1/4" (100)',      'Para concreto y block',                       'TF-0302', 3,   54.00, 0, 25, 'caja'),
  ('Clavo estándar 2 1/2" (1 kg)',     'Acero pulido',                                'TF-0303', 3,   46.00, 0, 20, 'kg'),
  ('Ancla expansiva 3/8"',             'Acero zincado para carga media',              'TF-0304', 3,   12.50, 0, 60, 'pza'),
  ('Tornillo hexagonal 3/8" x 2" (50)','Grado 5 galvanizado, con tuerca',             'TF-0305', 3,  189.00, 0, 10, 'caja'),
  ('Abrazadera sinfín 1/2" a 1 1/4" (10)','Acero inoxidable',                         'TF-0306', 3,   85.00, 0, 12, 'paquete'),
  -- Pasillo 4: Pinturas y adhesivos
  ('Pintura vinílica blanca 19 L',     'Interior y exterior, acabado mate',           'PA-0401', 4, 1590.00, 0, 4,  'cubeta'),
  ('Esmalte negro brillante 1 L',      'Base aceite, secado rápido',                  'PA-0402', 4,  229.00, 0, 6,  'lt'),
  ('Sellador acrílico 1 L',            'Para muros nuevos',                           'PA-0403', 4,  165.00, 0, 6,  'lt'),
  ('Pegamento de contacto en tubo 50 ml', 'Uso general, alta adherencia',          'PA-0404', 4,   42.00, 0, 12, 'pza'),
  ('Sellador de silicón 280 ml',       'Cartucho para pistola, antihongos',           'PA-0405', 4,   96.00, 0, 10, 'pza'),
  ('Rodillo para pintar 9"',           'Felpa de 3/8" con maneral',                   'PA-0406', 4,  119.00, 0, 8,  'pza'),
  ('Brocha de cerda 1 1/2"',          'Mango de madera',                             'PA-0407', 4,   35.00, 0, 12, 'pza'),
  -- Pasillo 5: Papelería
  ('Papel bond carta 500 hojas',       '75 g, blancura 97%',                          'PP-0501', 5,  119.00, 0, 30, 'paquete'),
  ('Cuaderno profesional raya 100 h',  'Espiral doble, pasta dura',                   'PP-0502', 5,   58.00, 0, 20, 'pza'),
  ('Bolígrafo azul punto medio (12)',  'Tinta de secado rápido',                      'PP-0503', 5,   62.00, 0, 15, 'caja'),
  ('Carpeta de cartón con liga',       'Tamaño carta, color kraft',                   'PP-0504', 5,   28.00, 0, 10, 'pza'),
  ('Engrapadora de escritorio',        'Capacidad 25 hojas',                          'PP-0505', 5,  175.00, 0, 5,  'pza'),
  ('Marcatextos colores surtidos (5)', 'Tinta fluorescente, punta cincel',            'PP-0506', 5,   89.00, 0, 8,  'paquete'),
  ('Cinta canela 48 mm x 150 m',       'Para embalaje, alta adherencia',              'PP-0507', 5,   42.00, 0, 24, 'rollo'),
  ('Calculadora de escritorio 12 dígitos','Solar y batería, teclas grandes',          'PP-0508', 5,  189.00, 0, 4,  'pza'),
  -- Pasillo 6: Cómputo y accesorios
  ('Mouse inalámbrico',                'Receptor USB 2.4 GHz, 1600 dpi',              'CA-0601', 6,  269.00, 0, 8,  'pza'),
  ('Teclado USB español',              'Perfil bajo, resistente a derrames',          'CA-0602', 6,  319.00, 0, 6,  'pza'),
  ('Cable HDMI 2 m',                   'HDMI 2.0, 4K a 60 Hz',                        'CA-0603', 6,   99.00, 0, 12, 'pza'),
  ('Memoria USB 64 GB',                'USB 3.2',                                     'CA-0604', 6,  159.00, 0, 10, 'pza'),
  ('Tóner compatible 85A',             'Rendimiento 1,600 páginas',                   'CA-0605', 6,  489.00, 0, 4,  'pza'),
  ('Audífonos estéreo de diadema',     'Almohadillas acolchadas, conector 3.5 mm',       'CA-0606', 6,  299.00, 0, 5,  'pza'),
  ('Multicontacto 5 salidas con apagadores', 'Supresor de picos, cable de 1.8 m',     'CA-0607', 6,  249.00, 0, 4,  'pza'),
  -- Pasillo 7: Limpieza
  ('Limpiador multiusos 1 L',          'Atomizador, aroma lavanda',                   'LI-0701', 7,   39.00, 0, 15, 'lt'),
  ('Toalla de papel para cocina (2 rollos)', 'Hoja doble, alta absorción',          'LI-0702', 7,   54.00, 0, 12, 'paquete'),
  ('Bolsa para basura jumbo (10)',     'Calibre grueso 90 x 120 cm',                  'LI-0703', 7,   49.00, 0, 20, 'paquete'),
  ('Gel antibacterial 250 ml',         'Alcohol 70%, tapa abatible',                  'LI-0704', 7,   45.00, 0, 12, 'pza'),
  ('Escoba de mijo',                   'Fibra natural, amarre de alambre',            'LI-0705', 7,   65.00, 0, 10, 'pza'),
  ('Jalador para piso 60 cm',          'Doble hule con bastón',                       'LI-0706', 7,   98.00, 0, 6,  'pza'),
  ('Cloro 1 L',                        'Blanqueador y desinfectante',                 'LI-0707', 7,   24.00, 0, 15, 'lt'),
  ('Cubeta de plástico 12 L',          'Con asa metálica, uso rudo',                  'LI-0708', 7,   69.00, 0, 8,  'pza');

-- Fotos (public/img/productos): cada producto tiene la suya.
-- sin-foto.svg queda solo como respaldo en la app para productos nuevos sin foto.
UPDATE productos p SET imagen = '/img/productos/' || f.archivo || '.webp'
FROM (VALUES
  ('HM-0101', 'martillo-una'),         ('HM-0102', 'juego-desarmadores'),   ('HM-0103', 'llave-ajustable'),
  ('HM-0104', 'pinza-electricista'),   ('HM-0105', 'flexometro'),           ('HM-0106', 'nivel-torpedo'),
  ('HM-0107', 'serrucho'),             ('HM-0108', 'pinza-presion'),
  ('HE-0201', 'taladro'),              ('HE-0202', 'esmeriladora'),         ('HE-0203', 'juego-brocas-metal'),
  ('HE-0204', 'disco-corte'),          ('HE-0205', 'sierra-circular'),      ('HE-0206', 'rotomartillo'),
  ('HE-0207', 'lijadora-orbital'),     ('HE-0208', 'pistola-calor'),
  ('TF-0301', 'tornillo-tablaroca'),   ('TF-0302', 'taquete-plastico'),     ('TF-0303', 'clavo-estandar'),
  ('TF-0304', 'ancla-expansiva'),      ('TF-0305', 'tornillo-hexagonal'),   ('TF-0306', 'abrazadera-sinfin'),
  ('PA-0401', 'pintura'),              ('PA-0402', 'esmalte-negro'),        ('PA-0403', 'sellador-acrilico'),
  ('PA-0404', 'pegamento-contacto'),   ('PA-0405', 'silicon-transparente'), ('PA-0406', 'rodillo-pintar'),
  ('PA-0407', 'brocha'),
  ('PP-0501', 'papel-bond'),           ('PP-0502', 'cuaderno-profesional'), ('PP-0503', 'boligrafo-azul'),
  ('PP-0504', 'carpeta-carton'),         ('PP-0505', 'engrapadora'),          ('PP-0506', 'marcatextos'),
  ('PP-0507', 'cinta-canela'),         ('PP-0508', 'calculadora'),
  ('CA-0601', 'mouse-inalambrico'),    ('CA-0602', 'teclado-usb'),          ('CA-0603', 'cable-hdmi'),
  ('CA-0604', 'memoria-usb'),          ('CA-0605', 'toner'),                ('CA-0606', 'audifonos'),
  ('CA-0607', 'multicontacto'),
  ('LI-0701', 'limpiador-multiusos'),  ('LI-0702', 'toalla-interdoblada'),  ('LI-0703', 'bolsa-basura'),
  ('LI-0704', 'gel-antibacterial'),    ('LI-0705', 'escoba'),               ('LI-0706', 'jalador'),
  ('LI-0707', 'cloro'),                ('LI-0708', 'cubeta')
) AS f(sku, archivo)
WHERE p.codigo_sku = f.sku;

-- -----------------------------------------------------
-- Movimientos de los ultimos 30 dias (deterministas)
-- -----------------------------------------------------
DO $$
DECLARE
  p        RECORD;
  d        INT;
  stock    INT;
  qty      INT;
  ts       TIMESTAMPTZ;
  low_list TEXT[] := ARRAY['HM-0105','HE-0202','TF-0304','PA-0401','PP-0501','CA-0605','LI-0702'];
  out_list TEXT[] := ARRAY['HE-0204'];
  is_low   BOOLEAN;
  is_out   BOOLEAN;
  target   INT;
  suppliers TEXT[] := ARRAY['Compra a Herrajes del Norte','Compra a Pinturas Mayoreo Sur','Compra a Suministros de Oficina Delta','Reabastecimiento semanal','Compra a Distribuidora del Bajío'];
  sales     TEXT[] := ARRAY['Venta mostrador','Venta a constructora','Pedido de oficina corporativa','Venta en línea','Venta mostrador'];
BEGIN
  PERFORM setseed(0.42);

  FOR p IN SELECT id, codigo_sku, existencia_minima AS mn FROM productos ORDER BY id LOOP
    is_low := p.codigo_sku = ANY(low_list);
    is_out := p.codigo_sku = ANY(out_list);

    -- Inventario inicial hace 32 dias
    stock := p.mn * 3 + floor(random() * p.mn * 2)::INT;
    ts := date_trunc('day', NOW()) - INTERVAL '32 days' + INTERVAL '9 hours';
    INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, existencia_anterior, existencia_nueva, fecha_creacion)
      VALUES (p.id, 'entrada', stock, 'Inventario inicial', 0, stock, ts);

    FOR d IN REVERSE 30..1 LOOP
      -- Salidas: 1 a 2 por dia con probabilidad
      IF random() < 0.55 THEN
        qty := GREATEST(1, ceil(random() * p.mn * 0.6)::INT);
        IF qty > stock THEN qty := stock; END IF;
        IF qty > 0 THEN
          ts := date_trunc('day', NOW()) - make_interval(days => d) + make_interval(hours => 10 + floor(random()*8)::INT, mins => floor(random()*60)::INT);
          INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, existencia_anterior, existencia_nueva, fecha_creacion)
            VALUES (p.id, 'salida', qty, sales[1 + floor(random()*5)::INT], stock, stock - qty, ts);
          stock := stock - qty;
        END IF;
      END IF;

      -- Reabastecimiento cuando baja del 150% del minimo (los productos "bajos" dejan de reabastecerse en los ultimos 12 dias)
      IF stock < ceil(p.mn * 1.5) AND NOT ((is_low OR is_out) AND d <= 6) AND random() < 0.7 THEN
        qty := p.mn * 2 + floor(random() * p.mn)::INT;
        ts := date_trunc('day', NOW()) - make_interval(days => d) + INTERVAL '8 hours 30 minutes';
        INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, existencia_anterior, existencia_nueva, fecha_creacion)
          VALUES (p.id, 'entrada', qty, suppliers[1 + floor(random()*5)::INT], stock, stock + qty, ts);
        stock := stock + qty;
      END IF;

      -- Ajuste por conteo fisico ocasional
      IF d IN (21, 7) AND random() < 0.15 AND stock > 2 THEN
        target := stock - 1;
        ts := date_trunc('day', NOW()) - make_interval(days => d) + INTERVAL '19 hours';
        INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, existencia_anterior, existencia_nueva, fecha_creacion)
          VALUES (p.id, 'ajuste', target, 'Ajuste por conteo físico', stock, target, ts);
        stock := target;
      END IF;
    END LOOP;

    -- Garantizar que los productos marcados queden bajo el minimo (o en cero)
    IF is_out AND stock > 0 THEN
      ts := NOW() - INTERVAL '3 hours';
      INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, existencia_anterior, existencia_nueva, fecha_creacion)
        VALUES (p.id, 'salida', stock, 'Venta a constructora', stock, 0, ts);
      stock := 0;
    ELSIF is_low AND stock = 0 THEN
      target := GREATEST(1, floor(p.mn * (0.3 + random() * 0.5))::INT);
      ts := NOW() - INTERVAL '6 hours';
      INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, existencia_anterior, existencia_nueva, fecha_creacion)
        VALUES (p.id, 'entrada', target, 'Reabastecimiento parcial', 0, target, ts);
      stock := target;
    ELSIF is_low AND stock >= p.mn THEN
      target := GREATEST(1, floor(p.mn * (0.3 + random() * 0.5))::INT);
      ts := NOW() - INTERVAL '2 hours';
      INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, existencia_anterior, existencia_nueva, fecha_creacion)
        VALUES (p.id, 'salida', stock - target, 'Pedido de oficina corporativa', stock, target, ts);
      stock := target;
    ELSIF NOT is_low AND NOT is_out AND stock <= p.mn THEN
      qty := p.mn * 2;
      ts := NOW() - INTERVAL '5 hours';
      INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, existencia_anterior, existencia_nueva, fecha_creacion)
        VALUES (p.id, 'entrada', qty, 'Reabastecimiento semanal', stock, stock + qty, ts);
      stock := stock + qty;
    END IF;

    UPDATE productos SET existencia = stock WHERE id = p.id;
  END LOOP;
END $$;

COMMIT;

SELECT
  (SELECT COUNT(*) FROM productos)                                            AS productos,
  (SELECT COUNT(*) FROM productos WHERE existencia <= existencia_minima)      AS stock_bajo,
  (SELECT COUNT(*) FROM movimientos_inventario)                               AS movimientos;
