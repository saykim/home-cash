import type { VercelRequest, VercelResponse } from "@vercel/node";
import { recurringTransactions } from "./db-schema.js";
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

    // GET: 전체 정기 거래 조회
    if (req.method === "GET") {
      const result = await db
        .select()
        .from(recurringTransactions)
        .where(eq(recurringTransactions.userId, userId));
      return res.status(200).json(result);
    }

    // POST: 정기 거래 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(recurringTransactions)
        .values({
          userId, // Auto-inject userId
          name: data.name,
          type: data.type,
          amount: String(data.amount),
          assetId: data.assetId,
          toAssetId: data.toAssetId,
          categoryId: data.categoryId,
          frequency: data.frequency,
          startDate: data.startDate,
          endDate: data.endDate,
          dayOfMonth: data.dayOfMonth,
          dayOfWeek: data.dayOfWeek,
          isActive: data.isActive ?? true,
          memo: data.memo,
        })
        .returning();
      return res.status(201).json(result[0]);
    }

    // PUT: 정기 거래 수정
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .update(recurringTransactions)
        .set({
          ...data,
          amount: data.amount !== undefined ? String(data.amount) : undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Recurring transaction not found" });
      }

      return res.status(200).json(result[0]);
    }

    // DELETE: 정기 거래 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .delete(recurringTransactions)
        .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Recurring transaction not found" });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
