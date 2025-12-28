import type { VercelRequest, VercelResponse } from "@vercel/node";
import { budgets } from "./db-schema.js";
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

    // GET: 예산 조회 (월별 필터 지원)
    if (req.method === "GET") {
      const { month } = req.query;
      if (month && typeof month === "string") {
        const result = await db
          .select()
          .from(budgets)
          .where(and(eq(budgets.userId, userId), eq(budgets.month, month)));
        return res.status(200).json(result);
      }
      const result = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, userId));
      return res.status(200).json(result);
    }

    // POST: 예산 추가/업데이트 (upsert 로직)
    if (req.method === "POST") {
      const data = req.body;

      // 같은 카테고리+월의 기존 예산 확인
      const existing = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.userId, userId),
            eq(budgets.categoryId, data.categoryId),
            eq(budgets.month, data.month)
          )
        );

      if (existing.length > 0) {
        // 기존 예산 업데이트
        const result = await db
          .update(budgets)
          .set({ amount: String(data.amount), updatedAt: new Date() })
          .where(eq(budgets.id, existing[0].id))
          .returning();
        return res.status(200).json(result[0]);
      }

      // 새 예산 추가
      const result = await db
        .insert(budgets)
        .values({
          userId, // Auto-inject userId
          categoryId: data.categoryId,
          amount: String(data.amount),
          month: data.month,
        })
        .returning();
      return res.status(201).json(result[0]);
    }

    // PUT: 예산 수정
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .update(budgets)
        .set({
          ...data,
          amount: data.amount !== undefined ? String(data.amount) : undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Budget not found" });
      }

      return res.status(200).json(result[0]);
    }

    // DELETE: 예산 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .delete(budgets)
        .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Budget not found" });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
