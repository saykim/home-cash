import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cardMonthlyPayments } from "./db-schema.js";
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
    const userId = await verifyAuth(req, db);

    // GET: 월별 결제 예정 조회
    if (req.method === "GET") {
      const { month } = req.query;
      if (!month || typeof month !== "string") {
        return res.status(400).json({ error: "Missing month parameter" });
      }

      const result = await db
        .select()
        .from(cardMonthlyPayments)
        .where(
          and(
            eq(cardMonthlyPayments.userId, userId),
            eq(cardMonthlyPayments.month, month)
          )
        );

      return res.status(200).json(result);
    }

    // POST: 결제 예정 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(cardMonthlyPayments)
        .values({
          userId,
          cardId: data.cardId,
          month: data.month,
          expectedAmount: String(data.expectedAmount),
          memo: data.memo,
        })
        .returning();
      return res.status(201).json(result[0]);
    }

    // PUT: 결제 예정 수정
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }

      const result = await db
        .update(cardMonthlyPayments)
        .set({
          ...data,
          expectedAmount:
            data.expectedAmount !== undefined
              ? String(data.expectedAmount)
              : undefined,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(cardMonthlyPayments.id, id),
            eq(cardMonthlyPayments.userId, userId)
          )
        )
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Record not found" });
      }

      return res.status(200).json(result[0]);
    }

    // DELETE: 결제 예정 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }

      const result = await db
        .delete(cardMonthlyPayments)
        .where(
          and(
            eq(cardMonthlyPayments.id, id),
            eq(cardMonthlyPayments.userId, userId)
          )
        )
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Record not found" });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
