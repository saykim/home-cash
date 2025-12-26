// Vercel Serverless Function DB 유틸 (TS 파일이지만 "순수 JS 문법"만 사용)
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { HttpError } from "./vercelHttp.js";

function readDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw || raw.trim().length === 0) {
    throw new HttpError(500, "DATABASE_URL_MISSING", "DATABASE_URL is missing");
  }
  return raw.trim();
}

export function createDb() {
  const url = readDatabaseUrl();
  const sql = neon(url);
  return drizzle(sql);
}


