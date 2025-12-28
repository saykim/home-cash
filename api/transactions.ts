import type { VercelRequest, VercelResponse } from "@vercel/node";
import { transactions, assets } from "./db-schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";
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

    // GET: 거래내역 조회 (공유 데이터셋 - userId 필터링 없음, 월별/기간 필터 지원)
    if (req.method === "GET") {
      const { month, startDate, endDate } = req.query;

      let result;
      if (month && typeof month === "string") {
        const start = `${month}-01`;
        const end = `${month}-31`;
        result = await db
          .select()
          .from(transactions)
          .where(
            and(
              gte(transactions.date, start),
              lte(transactions.date, end)
            )
          )
          .orderBy(desc(transactions.date));
      } else if (
        startDate &&
        endDate &&
        typeof startDate === "string" &&
        typeof endDate === "string"
      ) {
        result = await db
          .select()
          .from(transactions)
          .where(
            and(
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          )
          .orderBy(desc(transactions.date));
      } else {
        result = await db
          .select()
          .from(transactions)
          .orderBy(desc(transactions.date));
      }
      return res.status(200).json(result);
    }

    // POST: 거래내역 추가 + 자산 잔액 업데이트
    if (req.method === "POST") {
      const data = req.body;

      // 트랜잭션 추가
      const [newTx] = await db
        .insert(transactions)
        .values({
          userId, // Auto-inject userId
          date: data.date,
          type: data.type,
          amount: String(data.amount),
          assetId: data.assetId,
          toAssetId: data.toAssetId,
          categoryId: data.categoryId,
          cardId: data.cardId,
          memo: data.memo,
        })
        .returning();

      // 자산 잔액 업데이트 (공유 데이터셋 - userId 필터링 없음)
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, data.assetId));
      if (asset) {
        let newBalance = Number(asset.balance);
        if (data.type === "INCOME") {
          newBalance += Number(data.amount);
        } else if (data.type === "EXPENSE") {
          newBalance -= Number(data.amount);
        } else if (data.type === "TRANSFER") {
          newBalance -= Number(data.amount);
        }
        await db
          .update(assets)
          .set({ balance: String(newBalance), updatedAt: new Date() })
          .where(eq(assets.id, data.assetId));

        // 이체일 경우 대상 자산도 업데이트 (공유 데이터셋 - userId 필터링 없음)
        if (data.type === "TRANSFER" && data.toAssetId) {
          const [toAsset] = await db
            .select()
            .from(assets)
            .where(eq(assets.id, data.toAssetId));
          if (toAsset) {
            const toNewBalance = Number(toAsset.balance) + Number(data.amount);
            await db
              .update(assets)
              .set({ balance: String(toNewBalance), updatedAt: new Date() })
              .where(eq(assets.id, data.toAssetId));
          }
        }
      }

      return res.status(201).json(newTx);
    }

    // PUT: 거래내역 수정 (공유 데이터셋 - 소유권 체크 없음)
    if (req.method === "PUT") {
      const { id } = req.query;
      const data = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }
      const result = await db
        .update(transactions)
        .set({
          ...data,
          amount: data.amount !== undefined ? String(data.amount) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, id))
        .returning();

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      return res.status(200).json(result[0]);
    }

    // DELETE: 거래내역 삭제 + 자산 잔액 복구 (공유 데이터셋 - 소유권 체크 없음)
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing id" });
      }

      // 삭제 전 거래 정보 조회
      const [tx] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id));

      if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // 자산 잔액 복구
      const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, tx.assetId));
      if (asset) {
        let newBalance = Number(asset.balance);
        if (tx.type === "INCOME") {
          newBalance -= Number(tx.amount);
        } else if (tx.type === "EXPENSE") {
          newBalance += Number(tx.amount);
        } else if (tx.type === "TRANSFER") {
          newBalance += Number(tx.amount);
        }
        await db
          .update(assets)
          .set({ balance: String(newBalance), updatedAt: new Date() })
          .where(eq(assets.id, tx.assetId));

        // 이체였을 경우 대상 자산도 복구
        if (tx.type === "TRANSFER" && tx.toAssetId) {
          const [toAsset] = await db
            .select()
            .from(assets)
            .where(eq(assets.id, tx.toAssetId));
          if (toAsset) {
            const toNewBalance = Number(toAsset.balance) - Number(tx.amount);
            await db
              .update(assets)
              .set({ balance: String(toNewBalance), updatedAt: new Date() })
              .where(eq(assets.id, tx.toAssetId));
          }
        }
      }

      await db
        .delete(transactions)
        .where(eq(transactions.id, id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
