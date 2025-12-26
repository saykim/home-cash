import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { HttpError } from "./vercelHttp";

export type Db = NeonHttpDatabase;

function readDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw || raw.trim().length === 0) {
    throw new HttpError(500, "DATABASE_URL_MISSING", "DATABASE_URL is missing");
  }
  return raw.trim();
}

export function createDb(): Db {
  const url = readDatabaseUrl();
  // neon()은 connection string을 파싱하며 잘못된 값이면 여기서 예외가 날 수 있음
  const sql = neon(url);
  return drizzle(sql);
}


