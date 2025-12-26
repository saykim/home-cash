import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { budgets } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const db = getDb();

  try {
    // GET: 예산 조회 (월별 필터 지원)
    if (req.method === "GET") {
      const { month } = req.query;
      if (month && typeof month === "string") {
        const result = await db
          .select()
          .from(budgets)
          .where(eq(budgets.month, month));
        return res.status(200).json(result);
      }
      const result = await db.select().from(budgets);
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
        .where(eq(budgets.id, id))
        .returning();
      return res.status(200).json(result[0]);
    }

    // DELETE: 예산 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      await db.delete(budgets).where(eq(budgets.id, id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Budgets API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
