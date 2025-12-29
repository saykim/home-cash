import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assetBalanceHistory } from "./_lib/db-schema.js";
import { eq, desc } from "drizzle-orm";
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
    await verifyAuth(req, db);

    // GET: 특정 자산의 잔액 이력 조회 (최근 10개)
    if (req.method === "GET") {
      const { assetId } = req.query;
      if (!assetId || typeof assetId !== "string") {
        return res.status(400).json({ error: "Missing assetId" });
      }

      const result = await db
        .select()
        .from(assetBalanceHistory)
        .where(eq(assetBalanceHistory.assetId, assetId))
        .orderBy(desc(assetBalanceHistory.changedAt))
        .limit(10);

      return res.status(200).json(result);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
