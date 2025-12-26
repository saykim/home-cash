import type { VercelRequest, VercelResponse } from "@vercel/node";
import { transactionTemplates } from "./db-schema";
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
    // GET: 전체 템플릿 조회
    if (req.method === "GET") {
      const result = await db.select().from(transactionTemplates);
      return res.status(200).json(result);
    }

    // POST: 템플릿 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(transactionTemplates)
        .values({
          name: data.name,
          type: data.type,
          amount: String(data.amount),
          assetId: data.assetId,
          toAssetId: data.toAssetId,
          categoryId: data.categoryId,
          cardId: data.cardId,
          memo: data.memo,
        })
        .returning();
      return res.status(201).json(result[0]);
    }

    // PUT: 템플릿 수정
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .update(transactionTemplates)
        .set({
          ...data,
          amount: data.amount !== undefined ? String(data.amount) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(transactionTemplates.id, id))
        .returning();
      return res.status(200).json(result[0]);
    }

    // DELETE: 템플릿 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      await db
        .delete(transactionTemplates)
        .where(eq(transactionTemplates.id, id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
