# InvenTrack — Sistema de Gestión de Inventario

> **TSBD-U2 • Aplicación de Base de Datos y Tecnologías Web**  
> Stack: Astro SSR · PostgreSQL · Docker · AWS EC2/RDS · Resend · ExchangeRate API

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
│   └── init.sql                ← Esquema + datos de prueba
└── src/
    ├── db/
    │   ├── schema.ts           ← Drizzle ORM schema
    │   └── index.ts            ← Conexión DB singleton
    ├── lib/
    │   ├── xml.ts              ← Export/Import XML
    │   ├── email.ts            ← Alertas Resend
    │   └── exchangeRate.ts     ← API tipo de cambio
    ├── layouts/
    │   └── Layout.astro        ← Layout con sidebar
    ├── pages/
    │   ├── index.astro         ← Dashboard + gráficas
    │   ├── productos.astro     ← CRUD productos
    │   ├── categorias.astro    ← CRUD categorías
    │   ├── movimientos.astro   ← Historial movimientos
    │   ├── xml.astro           ← Import/Export XML
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
| Dashboard      | KPIs, gráfica por categoría, stock bajo, últimos movimientos, tipo de cambio USD/MXN en tiempo real |
| Productos      | CRUD completo, búsqueda, filtros, gestión de stock          |
| Categorías     | CRUD, contador de productos por categoría                   |
| Movimientos    | Historial completo, filtros por tipo                        |
| XML            | Export con resumen estadístico, Import masivo desde archivo |
| Alertas        | Email automático cuando stock ≤ stock mínimo                |

---

*Autor: **Jovany Morales del Ángel** · 2026*
