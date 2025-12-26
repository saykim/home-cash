import type { VercelRequest, VercelResponse } from "@vercel/node";
import { creditCards } from "./db-schema.js";
import { eq } from "drizzle-orm";
import { createDb } from "./_lib/vercelDb.js";
import { getRequestId, sendError, setCorsHeaders } from "./_lib/vercelHttp.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const requestId = getRequestId(req);

  try {
    const db = createDb();
    // GET: 전체 신용카드 조회
    if (req.method === "GET") {
      const result = await db.select().from(creditCards);
      return res.status(200).json(result);
    }

    // POST: 신용카드 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(creditCards)
        .values({
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
        .where(eq(creditCards.id, id))
        .returning();
      return res.status(200).json(result[0]);
    }

    // DELETE: 신용카드 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      await db.delete(creditCards).where(eq(creditCards.id, id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
