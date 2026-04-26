import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Singleton para evitar múltiples conexiones en dev con HMR
const globalForDb = globalThis as unknown as { _db: ReturnType<typeof drizzle> | undefined };

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no está definida en las variables de entorno');

  const client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 30,
  });

  return drizzle(client, { schema });
}

export const db = globalForDb._db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb._db = db;
}