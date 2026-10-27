import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Node 22+ trae WebSocket nativo, que usa el driver de Neon para transacciones.
if (typeof WebSocket !== "undefined") neonConfig.webSocketConstructor = WebSocket;

type DB = NeonDatabase<typeof schema>;
const globalForDb = globalThis as unknown as { __mannyDb?: DB; __mannyPool?: Pool };

function create(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL (ver .env.example)");
  const pool = new Pool({ connectionString: url, max: 5 });
  globalForDb.__mannyPool = pool;
  return drizzle(pool, { schema });
}

export const db: DB = new Proxy({} as DB, {
  get(_t, prop) {
    globalForDb.__mannyDb ??= create();
    return Reflect.get(globalForDb.__mannyDb, prop, globalForDb.__mannyDb);
  },
});

export async function closeDb() {
  await globalForDb.__mannyPool?.end();
  globalForDb.__mannyDb = undefined;
  globalForDb.__mannyPool = undefined;
}

export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export { schema };
