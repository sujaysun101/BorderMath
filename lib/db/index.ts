import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as unknown as { bordermathPg?: ReturnType<typeof postgres> };

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!globalForDb.bordermathPg) {
    globalForDb.bordermathPg = postgres(url, { max: 1 });
  }
  return drizzle(globalForDb.bordermathPg, { schema });
}

export type Database = ReturnType<typeof getDb>;
