import type { VercelRequest, VercelResponse } from "@vercel/node";
import { categories } from "./db-schema.js";
import { eq, and } from "drizzle-orm";
import { createDb } from "./_lib/vercelDb.js";
import { getRequestId, sendError, setCorsHeaders } from "./_lib/vercelHttp.js";
import { verifyAuth } from "./_lib/vercelAuth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const requestId = getRequestId(req);

  try {
    const db = createDb();

    // Verify authentication and get user ID
    const userId = await verifyAuth(req, db);

    // GET: 사용자별 카테고리 조회
    if (req.method === "GET") {
      const result = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId));
      return res.status(200).json(result);
    }

    // POST: 카테고리 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(categories)
        .values({
          userId, // Auto-inject userId
          name: data.name,
          kind: data.kind,
          icon: data.icon,
          color: data.color,
        })
        .returning();
      return res.status(201).json(result[0]);
    }

    // PUT: 카테고리 수정 (본인 데이터만)
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .update(categories)
        .set(data)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.status(200).json(result[0]);
    }

    // DELETE: 카테고리 삭제 (본인 데이터만)
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
