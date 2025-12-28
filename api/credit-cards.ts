import type { VercelRequest, VercelResponse } from "@vercel/node";
import { creditCards } from "./db-schema.js";
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

    // GET: 전체 신용카드 조회
    if (req.method === "GET") {
      const result = await db
        .select()
        .from(creditCards)
        .where(eq(creditCards.userId, userId));
      return res.status(200).json(result);
    }

    // POST: 신용카드 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(creditCards)
        .values({
          userId, // Auto-inject userId
          name: data.name,
          billingDay: data.billingDay,
          startOffset: data.startOffset,
          startDay: data.startDay,
          endOffset: data.endOffset,
          endDay: data.endDay,
          linkedAssetId: data.linkedAssetId,
        })
        .returning();
      return res.status(201).json(result[0]);
    }

    // PUT: 신용카드 수정
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .update(creditCards)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Credit card not found" });
      }

      return res.status(200).json(result[0]);
    }

    // DELETE: 신용카드 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .delete(creditCards)
        .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Credit card not found" });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
