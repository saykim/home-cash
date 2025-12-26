import type { VercelRequest, VercelResponse } from "@vercel/node";
import { annualEvents } from "./db-schema";
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
    // GET: 전체 연례 이벤트 조회
    if (req.method === "GET") {
      const result = await db.select().from(annualEvents);
      return res.status(200).json(result);
    }

    // POST: 연례 이벤트 추가
    if (req.method === "POST") {
      const data = req.body;
      const result = await db
        .insert(annualEvents)
        .values({
          name: data.name,
          type: data.type,
          month: data.month,
          day: data.day,
          amount: data.amount ? String(data.amount) : null,
          memo: data.memo,
          firstYear: data.firstYear,
          isActive: data.isActive ?? true,
        })
        .returning();
      return res.status(201).json(result[0]);
    }

    // PUT: 연례 이벤트 수정
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .update(annualEvents)
        .set({
          ...data,
          amount:
            data.amount !== undefined
              ? data.amount
                ? String(data.amount)
                : null
              : undefined,
          updatedAt: new Date(),
        })
        .where(eq(annualEvents.id, id))
        .returning();
      return res.status(200).json(result[0]);
    }

    // DELETE: 연례 이벤트 삭제
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      await db.delete(annualEvents).where(eq(annualEvents.id, id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
