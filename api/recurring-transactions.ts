import type { VercelRequest, VercelResponse } from "@vercel/node";
import { recurringTransactions } from "./db-schema";
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
    // GET: 전체 정기 거래 조회
    if (req.method === "GET") {
      const result = await db.select().from(recurringTransactions);
      return res.status(200).json(result);
    }

    // POST: 정기 거래 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(recurringTransactions)
        .values({
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
        .where(eq(recurringTransactions.id, id))
        .returning();
      return res.status(200).json(result[0]);
    }

    // DELETE: 정기 거래 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      await db
        .delete(recurringTransactions)
        .where(eq(recurringTransactions.id, id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
