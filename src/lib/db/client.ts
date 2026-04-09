import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Return null when DB not configured — app falls back to localStorage
    return null;
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export const db = getDb();
export type Db = NonNullable<typeof db>;
