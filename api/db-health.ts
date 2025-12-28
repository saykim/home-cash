import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "drizzle-orm";
import { createDb } from "./_lib/vercelDb.js";
import { getRequestId, sendError, setCorsHeaders } from "./_lib/vercelHttp.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const requestId = getRequestId(req);

  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const db = createDb();
    const result = await db.execute(sql`select 1 as ok`);

    return res.status(200).json({
      ok: true,
      requestId,
      result,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return sendError(res, requestId, err);
  }
}


