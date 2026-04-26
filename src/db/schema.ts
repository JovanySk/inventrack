import { pgTable, serial, varchar, text, integer, decimal, timestamp, boolean, pgEnum, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───
export const movementTypeEnum = pgEnum('tipo_movimiento', ['entrada', 'salida', 'ajuste']);

// ─── ABAC (Attribute-Based Access Control) ───
export const roles = pgTable('roles', {
  name: varchar('nombre', { length: 50 }).primaryKey(),
  description: varchar('descripcion', { length: 200 }),
});

export const permissions = pgTable('permisos', {
  id: varchar('id', { length: 50 }).primaryKey(),
  description: varchar('descripcion', { length: 200 }),
});

export const rolePermissions = pgTable('permisos_rol', {
  roleName: varchar('nombre_rol', { length: 50 }).references(() => roles.name).notNull(),
  permissionId: varchar('id_permiso', { length: 50 }).references(() => permissions.id).notNull(),
});

// ─── Usuarios ───
export const users = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  email: varchar('correo_electronico', { length: 255 }).notNull().unique(),
  name: varchar('nombre', { length: 100 }).notNull(),
  passwordHash: varchar('hash_contrasena', { length: 255 }).notNull(),
  role: varchar('rol', { length: 20 }).notNull().default('empleado'),
  // ─── Confirmación de cuenta ───
  accountStatus: varchar('estado_cuenta', { length: 20 }).default('activo'),
  emailConfirmed: boolean('correo_confirmado').default(true),
  confirmationToken: varchar('token_confirmacion', { length: 255 }),
  tokenExpiresAt: timestamp('fecha_expiracion_token', { withTimezone: true }),
  // ─── Seguridad ───
  isActive: boolean('esta_activo').default(true),
  failedAttempts: integer('intentos_fallidos_login').default(0),
  lockedUntil: timestamp('bloqueado_hasta', { withTimezone: true }),
  twoFactorSecret: varchar('secreto_2fa', { length: 255 }),
  createdAt: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('fecha_actualizacion', { withTimezone: true }).defaultNow(),
});

// ─── Categorías ───
export const categories = pgTable('categorias', {
  id: serial('id').primaryKey(),
  name: varchar('nombre', { length: 100 }).notNull().unique(),
  description: text('descripcion'),
  createdAt: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
});

// ─── Productos ───
export const products = pgTable('productos', {
  id: serial('id').primaryKey(),
  name: varchar('nombre', { length: 200 }).notNull(),
  description: text('descripcion'),
  sku: varchar('codigo_sku', { length: 50 }).unique(),
  categoryId: integer('categoria_id').references(() => categories.id),
  price: decimal('precio', { precision: 10, scale: 2 }).notNull().default('0'),
  stock: integer('existencia').notNull().default(0),
  minStock: integer('existencia_minima').notNull().default(5),
  unit: varchar('unidad', { length: 20 }).default('pza'),
  isActive: boolean('esta_activo').default(true),
  createdAt: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('fecha_actualizacion', { withTimezone: true }).defaultNow(),
});

// ─── Movimientos de Stock ───
export const stockMovements = pgTable('movimientos_inventario', {
  id: serial('id').primaryKey(),
  productId: integer('producto_id').references(() => products.id).notNull(),
  type: movementTypeEnum('tipo').notNull(),
  quantity: integer('cantidad').notNull(),
  reason: text('motivo'),
  previousStock: integer('existencia_anterior').notNull(),
  newStock: integer('existencia_nueva').notNull(),
  createdAt: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
});

// ─── Audit Logs ───
export const auditLogs = pgTable('registros_auditoria', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('usuario_id').references(() => users.id),
  action: varchar('accion', { length: 50 }).notNull(),
  entityType: varchar('tipo_entidad', { length: 50 }).notNull(),
  entityId: integer('entidad_id'),
  oldValues: jsonb('valores_antiguos'),
  newValues: jsonb('valores_nuevos'),
  ipAddress: varchar('direccion_ip'),
  createdAt: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
});

// ─── Relaciones ───
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  movements: many(stockMovements),
}));

export const movementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
}));

// ─── Tipos TypeScript ───
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Movement = typeof stockMovements.$inferSelect;
export type NewMovement = typeof stockMovements.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;