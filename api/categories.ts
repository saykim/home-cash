import type { VercelRequest, VercelResponse } from "@vercel/node";
import { categories } from "./db-schema";
import { eq } from "drizzle-orm";
import { createDb } from "../src/server/vercelDb";
import { getRequestId, sendError, setCorsHeaders } from "../src/server/vercelHttp";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const requestId = getRequestId(req);

  try {
    const db = createDb();
    // GET: 전체 카테고리 조회
    if (req.method === "GET") {
      const result = await db.select().from(categories);
      return res.status(200).json(result);
    }

    // POST: 카테고리 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(categories)
        .values({
          name: data.name,
          kind: data.kind,
          icon: data.icon,
          color: data.color,
        })
        .returning();
      return res.status(201).json(result[0]);
    }

    // PUT: 카테고리 수정
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .update(categories)
        .set(data)
        .where(eq(categories.id, id))
        .returning();
      return res.status(200).json(result[0]);
    }

    // DELETE: 카테고리 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      await db.delete(categories).where(eq(categories.id, id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
