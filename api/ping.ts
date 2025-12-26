import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestId, sendError, setCorsHeaders } from "./_lib/vercelHttp";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const requestId = getRequestId(req);

  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    return res.status(200).json({
      ok: true,
      requestId,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
      nodeEnv: process.env.NODE_ENV ?? null,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return sendError(res, requestId, err);
  }
}


