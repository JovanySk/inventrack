# InvenTrack — Sistema de Gestión de Inventario

> **TSBD-U2 • Aplicación de Base de Datos y Tecnologías Web**  
> Stack: Astro SSR · PostgreSQL · Docker · AWS EC2/RDS · Resend · ExchangeRate API

---

## Screenshots

<p align="center"><img src="docs/screenshots/carrusel.gif" alt="Carrusel del resumen y cinta de productos en movimiento" width="900"></p>

| | |
|---|---|
| ![Resumen](docs/screenshots/02-dashboard.png) | ![Productos](docs/screenshots/03-productos.png) |
| **Resumen**: carrusel con datos reales, KPIs, pasillos, productos por surtir con pestañas, entradas y salidas de 30 días y ticket de últimos movimientos | **Productos**: pasillos con foto como filtro, estado (todos, stock bajo, agotados), orden, tarjetas con barra de disponibilidad y paginación |
| ![Alertas](docs/screenshots/04-alertas.png) | ![Login](docs/screenshots/01-login.png) |
| **Alertas**: resumen por urgencia, pedido sugerido y costo por producto, vista previa del correo al proveedor | **Login** con acceso de un clic a las cuentas de demostración |
| ![Carrusel 2](docs/screenshots/02-carrusel-2.png) | ![Carrusel 3](docs/screenshots/02-carrusel-3.png) |
| Diapositiva **Reabastecer hoy**: el producto más urgente con su pedido sugerido | Diapositiva **Lo más vendido del mes**: más unidades de salida en 30 días |
| ![Movimientos](docs/screenshots/05-movimientos.png) | ![Pasillos](docs/screenshots/06-pasillos.png) |
| **Movimientos**: historial con filtros por tipo | **Pasillos**: categorías con foto y número de productos |
| ![Importar XML](docs/screenshots/07-importar-xml.png) | ![Registrar movimiento](docs/screenshots/10-registrar-movimiento.png) |
| **Importar XML** y exportación del inventario | **Registrar movimiento** con vista previa de la existencia resultante |
| ![Ayuda](docs/screenshots/ayuda.png) | ![Usuarios](docs/screenshots/11-usuarios.png) |
| **Ayuda**: guía rápida, niveles de existencia, movimientos, XML, roles y permisos, atajos de teclado y preguntas frecuentes | **Usuarios**: cuentas y roles (solo administradores) |

<p align="center"><img src="docs/screenshots/footer.png" alt="Pie de página con columnas de enlaces, redes y créditos" width="900"></p>
<p align="center"><sub><b>Pie de página</b> en todas las páginas internas: franja de seguridad, columnas Inventario, Herramientas, Cuenta y Ayuda (solo enlaces a páginas existentes), redes sociales próximamente y créditos. El login muestra la versión mínima.</sub></p>

<p align="center">
  <img src="docs/screenshots/08-movil-resumen.png" alt="Resumen en móvil" width="260">
  <img src="docs/screenshots/09-movil-productos.png" alt="Productos en móvil" width="260">
  <img src="docs/screenshots/12-movil-login.png" alt="Login en móvil" width="260">
</p>

### Diseño

El rediseño sigue el archivo de Figma aprobado (tema "bodega" de ferretería):

- **Tipografía**: Barlow Condensed (títulos, cifras y precios) y Barlow (texto), autoalojadas con `@fontsource` porque la CSP no permite CDNs de fuentes. JetBrains Mono solo en el ticket de movimientos.
- **Color**: un solo acento amarillo `#FFC72C` (navegación, botones, etiquetas BAJO), tinta `#141414`, fondo concreto `#F2F1ED`, acero `#5B6470` para texto secundario. Rojo `#D7261E` solo para agotado o crítico y verde `#1F8A4C` solo para bien surtido. Solo tema claro.
- **Estructura**: encabezado negro con logo y búsqueda, navegación amarilla con conteo de alertas, cinta negra de productos y contenido de 1280 px. Esquinas rectas y sombras duras solo en etiquetas especiales.
- **Movimiento** (respeta `prefers-reduced-motion`): carrusel de 3 diapositivas que avanza cada 4 s (pausa al pasar el cursor o con foco, flechas, puntos, teclado y deslizamiento en móvil), cinta en bucle continuo que se pausa al pasar el cursor, tarjetas que suben 4 px, barras de disponibilidad que se llenan al entrar en pantalla (IntersectionObserver, sin listeners de scroll) y KPIs que cuentan hasta su valor.
- **Fotos**: `public/img/productos/*.webp` (generadas con `node scripts/optimize-images.mjs` desde los originales en `assets/img-src/`, fuera del bundle). Cada producto del catálogo demo tiene su propia foto, asignada por SKU en `db/demo-seed.sql` (columna `imagen`). Para productos nuevos sin foto se usa la que coincide con su nombre o la de su pasillo, y `sin-foto.svg` solo como último respaldo. En el formulario de producto se elige la foto de ese catálogo (no hay carga de archivos). Origen y licencia de cada foto: [`docs/CREDITS.md`](docs/CREDITS.md).
- **Pasillo**: el número de pasillo que se muestra corresponde al id de la categoría.

---

## Run the demo

Requisitos: Docker Desktop y Node 20+. Postgres corre en Docker y la app en el host (consume menos RAM que levantar todo con Compose).

```bash
# 1. Base de datos (crea esquema, roles y usuarios demo desde db/init.sql)
docker compose up -d db

# 2. Datos de demostración: 52 productos de ferretería y papelería, cada uno con su foto, 7 pasillos,
#    ~1,000 movimientos de los últimos 30 días y 8 productos bajo su mínimo (1 agotado)
#    (el seed agrega la columna "imagen" si la base se creó con una versión anterior;
#    también existe db/migrations/0001_producto_imagen.sql)
docker compose exec -T db psql -U inventario -d inventario_db < db/demo-seed.sql

# 3. Variables locales (valores desechables, solo para desarrollo)
cat > .env <<'ENV'
DATABASE_URL=postgres://inventario:secret123@localhost:5432/inventario_db
JWT_SECRET=cambia-esto-en-local
ALERT_EMAIL=compras@ejemplo.test
APP_URL=http://localhost:3000
ENV

# 4. App (exporta las variables para que middleware y páginas usen el mismo JWT_SECRET)
npm ci
set -a && . ./.env && set +a
npm run dev        # http://localhost:3000
```

Cuentas: `admin@inventrack.com` / `admin123` (acceso completo) y `demo@inventrack.com` / `demo123` (solo lectura). En el login hay botones de acceso rápido.

**Correo en modo registro.** Si `RESEND_API_KEY` no está definida (o si `EMAIL_MODE=log`), no se envía ningún correo: las alertas de stock bajo se escriben en la consola del servidor (destinatario, asunto y texto). La página **Alertas** muestra la vista previa exacta del correo y un botón para generar la alerta. Para enviar correos reales define `RESEND_API_KEY` y `SENDER_EMAIL` con un dominio verificado en Resend.

Para limpiar: `docker compose down -v` (elimina también el volumen de datos).

---

## 🚀 Levantarlo en 30 segundos (cualquier máquina con Docker)

```bash
git clone <tu-repo>
cd inventario-app
cp .env.example .env
docker compose up --build
```

| Servicio   | URL                         |
|------------|-----------------------------|
| 🌐 App      | http://localhost:3000       |
| 🐘 pgAdmin  | http://localhost:5050       |

**pgAdmin** → credenciales: `admin@inventario.com` / `admin123`  
Conectar servidor: host `db`, puerto `5432`, usuario `inventario`, contraseña `secret123`

---

## 📦 Stack Tecnológico

| Capa            | Tecnología               | Justificación                         |
|-----------------|--------------------------|---------------------------------------|
| Frontend/SSR    | **Astro 4**              | SSR real, no SPA, rápido y moderno    |
| Estilos         | **Tailwind CSS**         | Utilidades, no CSS estático           |
| Base de datos   | **PostgreSQL 16**        | Relacional, robusta, ACID             |
| ORM             | **Drizzle ORM**          | Type-safe, ligero, moderno            |
| Contenedores    | **Docker + Compose**     | Reproducible en cualquier máquina     |
| Email           | **Resend API**           | Alertas automáticas de stock bajo     |
| Tipo de cambio  | **open.er-api.com**      | Precios en USD/MXN en tiempo real     |
| Interoperab.    | **XML (xml2js)**         | Export/Import de inventario           |
| Deploy          | **AWS EC2 + RDS**        | Infraestructura real, no hosting gratis|

---

## 🗄️ Estructura de la Base de Datos

```sql
categories        products             stock_movements
──────────────   ─────────────────    ──────────────────────
id (PK)          id (PK)              id (PK)
name             name                 product_id (FK)
description      description          type (entrada/salida/ajuste)
created_at       sku (UNIQUE)         quantity
                 category_id (FK)     previous_stock
                 price                new_stock
                 stock                reason
                 min_stock            created_at
                 unit
                 created_at
                 updated_at
```

---

## 📄 Formato XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<inventario version="1.0" generado="ISO-8601" empresa="...">
  <productos>
    <producto>
      <id>1</id>
      <nombre>Laptop Dell XPS 13</nombre>
      <sku>ELEC-001</sku>
      <categoria>Electrónica</categoria>
      <precio>15999.99</precio>
      <stock>8</stock>
      <stockMinimo>3</stockMinimo>
      <unidad>pza</unidad>
      <fechaCreacion>2024-04-22T...</fechaCreacion>
    </producto>
  </productos>
  <resumen>
    <totalProductos>12</totalProductos>
    <valorTotal>185430.50</valorTotal>
    <stockBajo>3</stockBajo>
  </resumen>
</inventario>
```

---

## ☁️ Deploy en AWS

### 1. Crear instancia EC2

```bash
# En AWS Console:
# - AMI: Ubuntu 22.04 LTS
# - Tipo: t2.micro (free tier)
# - Security Group: abrir puertos 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

### 2. Crear base de datos RDS (opcional, o usar Docker en EC2)

```bash
# En AWS RDS Console:
# - Motor: PostgreSQL 16
# - Clase: db.t3.micro (free tier)
# - Guardar el endpoint
```

### 3. Instalar Docker en EC2

```bash
ssh -i tu-key.pem ubuntu@<ec2-ip>

sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker
```

### 4. Deploy

```bash
# En EC2
git clone <tu-repo>
cd inventario-app

# Configurar variables de entorno para producción
cat > .env << EOF
DATABASE_URL=postgres://inventario:secret123@db:5432/inventario_db
RESEND_API_KEY=re_tu_key_real
ALERT_EMAIL=tu@email.com
EOF

# Si usas RDS, en docker-compose.prod.yml pon el endpoint de RDS como DATABASE_URL
# y no levantes el servicio "db"

docker compose up --build -d
```

### 5. (Opcional) Dominio + HTTPS con Nginx

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
# Configurar nginx como reverse proxy hacia localhost:3000
```

---

## 🔌 Integraciones

### Email — Resend
1. Regístrate gratis en [resend.com](https://resend.com)
2. Crea una API key
3. Ponla en `.env` como `RESEND_API_KEY`
4. Se dispara automáticamente cuando el stock baja del mínimo

### Tipo de cambio — open.er-api.com
- **Sin API key** — completamente gratis
- Se consulta automáticamente en el dashboard
- Muestra el valor del inventario en USD y MXN
- Caché de 1 hora para no saturar la API

---

## 📁 Estructura del Proyecto

```
inventario-app/
├── docker-compose.yml          ← Dev local
├── docker-compose.prod.yml     ← AWS production
├── Dockerfile
├── .env.example
├── astro.config.mjs
├── tailwind.config.mjs
├── db/
│   ├── init.sql                ← Esquema + datos de prueba
│   ├── demo-seed.sql           ← Catálogo de demostración con fotos
│   └── migrations/             ← Cambios de esquema (columna imagen)
└── src/
    ├── db/
    │   ├── schema.ts           ← Drizzle ORM schema
    │   └── index.ts            ← Conexión DB singleton
    ├── lib/
    │   ├── catalog.ts          ← Fotos, niveles de existencia, pedido sugerido, carrusel
    │   ├── cards.ts            ← Tarjeta de producto
    │   ├── xml.ts              ← Export/Import XML
    │   ├── email.ts            ← Alertas Resend
    │   └── exchangeRate.ts     ← API tipo de cambio
    ├── components/
    │   └── SiteFooter.astro    ← Pie de página (enlaces en src/lib/footer.ts)
    ├── layouts/
    │   └── Layout.astro        ← Encabezado, navegación, cinta de productos y pie
    ├── pages/
    │   ├── index.astro         ← Dashboard + gráficas
    │   ├── productos.astro     ← CRUD productos
    │   ├── categorias.astro    ← CRUD categorías
    │   ├── movimientos.astro   ← Historial movimientos
    │   ├── xml.astro           ← Import/Export XML
    │   ├── ayuda.astro         ← Guía rápida, roles, atajos y preguntas frecuentes
    │   └── api/
    │       ├── products/       ← REST API productos
    │       ├── categories/     ← REST API categorías
    │       ├── movements/      ← REST API movimientos
    │       ├── dashboard.ts    ← Stats + tipo de cambio
    │       ├── alerts/         ← Trigger email alertas
    │       └── xml/            ← Export/Import XML
    └── styles/
        └── global.css
```

---

## 🐳 Desarrollo local con Docker

```bash
# Clonar
git clone <repo>
cd inventario-app

# Levantar (requiere Docker Desktop)
docker compose up

# Cada cambio en el código → hot reload automático
# Base de datos persiste en volumen Docker local
```

**No se necesita instalar** Node.js, PostgreSQL, ni nada más. Solo Docker. 

---

## 📊 Funcionalidades

| Módulo         | Características                                              |
|----------------|--------------------------------------------------------------|
| Resumen        | Carrusel con datos reales (totales, reabastecer hoy, más vendido), KPIs, pasillos, productos por surtir con pestañas, gráfica de entradas y salidas, ticket de movimientos, tipo de cambio USD/MXN |
| Productos      | CRUD completo con foto, búsqueda desde el encabezado, filtro por pasillo y estado, orden, paginación, registro de movimientos |
| Pasillos       | CRUD de categorías, contador de productos por pasillo       |
| Movimientos    | Historial completo, filtros por tipo                        |
| XML            | Export con resumen estadístico, Import masivo desde archivo |
| Alertas        | Lista por urgencia con pedido sugerido y costo, email automático cuando stock ≤ stock mínimo (modo registro sin API key) |

---

*Autor: **Jovany Morales del Ángel** · 2026*
