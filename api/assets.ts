import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assets } from "./db-schema.js";
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

    // GET: 사용자별 자산 조회
    if (req.method === "GET") {
      const result = await db
        .select()
        .from(assets)
        .where(eq(assets.userId, userId));
      return res.status(200).json(result);
    }

    // POST: 자산 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(assets)
        .values({
          userId, // Auto-inject userId
          name: data.name,
          type: data.type,
          balance: String(data.balance || data.initialBalance || 0),
          initialBalance: String(data.initialBalance || 0),
        })
        .returning();
      return res.status(201).json(result[0]);
    }

    // PUT: 자산 수정 (본인 데이터만)
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .update(assets)
        .set({
          ...data,
          balance:
            data.balance !== undefined ? String(data.balance) : undefined,
          initialBalance:
            data.initialBalance !== undefined
              ? String(data.initialBalance)
              : undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(assets.id, id), eq(assets.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Asset not found" });
      }

      return res.status(200).json(result[0]);
    }

    // DELETE: 자산 삭제 (본인 데이터만)
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .delete(assets)
        .where(and(eq(assets.id, id), eq(assets.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Asset not found" });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
