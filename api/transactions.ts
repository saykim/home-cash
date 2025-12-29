import type { VercelRequest, VercelResponse } from "@vercel/node";
import { transactions, assets, creditCards } from "./_lib/db-schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { createDb } from "./_lib/vercelDb.js";
import { getRequestId, sendError, setCorsHeaders } from "./_lib/vercelHttp.js";
import { verifyAuth } from "./_lib/vercelAuth.js";

/**
 * 안전하게 문자열이 비어있지 않은지 확인하는 헬퍼 함수
 * undefined, null, 빈 문자열을 모두 false로 처리
 */
function isEmptyString(value: any): boolean {
  return !value || (typeof value === "string" && value.trim() === "");
}

/**
 * 안전하게 문자열을 정리하고 null로 변환하는 헬퍼 함수
 * undefined, null, 빈 문자열을 null로 변환
 */
function sanitizeString(value: any): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

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
            and(gte(transactions.date, start), lte(transactions.date, end))
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

      // 디버깅을 위한 요청 데이터 로깅
      console.log("[transactions POST] Request data:", {
        date: data.date,
        type: data.type,
        amount: data.amount,
        assetId: data.assetId,
        cardId: data.cardId,
        categoryId: data.categoryId,
        toAssetId: data.toAssetId,
      });

      // 필수 필드 검증
      if (!data.date || !data.type || !data.amount) {
        return res.status(400).json({ error: "날짜, 유형, 금액은 필수입니다." });
      }

      // categoryId 검증 (스키마에서 notNull이므로 항상 필수)
      if (isEmptyString(data.categoryId)) {
        return res.status(400).json({ error: "카테고리는 필수입니다." });
      }

      // Sanitize assetId: convert empty string to null for UUID compatibility
      let sanitizedAssetId = sanitizeString(data.assetId);

      // 카드 지출인 경우 assetId가 없어도 됨
      const sanitizedCardId = sanitizeString(data.cardId);
      const isCardExpense = data.type === "EXPENSE" && sanitizedCardId && sanitizedCardId !== "NONE";

      // 직불카드인 경우 linkedAssetId를 assetId로 설정하여 즉시 차감
      if (isCardExpense && sanitizedCardId) {
        const [card] = await db
          .select()
          .from(creditCards)
          .where(eq(creditCards.id, sanitizedCardId));

        if (card && card.cardType === "DEBIT") {
          sanitizedAssetId = card.linkedAssetId;
        }
      }

      if (!isCardExpense && !sanitizedAssetId) {
        return res.status(400).json({ error: "자산을 선택해주세요." });
      }

      // 트랜잭션 추가
      const [newTx] = await db
        .insert(transactions)
        .values({
          userId, // Auto-inject userId
          date: data.date,
          type: data.type,
          amount: String(data.amount),
          assetId: sanitizedAssetId,
          toAssetId: sanitizeString(data.toAssetId),
          categoryId: data.categoryId, // 항상 필수 (스키마에서 notNull)
          cardId: sanitizedCardId && sanitizedCardId !== "NONE" ? sanitizedCardId : null,
          memo: sanitizeString(data.memo),
        })
        .returning();

      // 자산 잔액 업데이트 (공유 데이터셋 - userId 필터링 없음)
      // assetId가 있을 때만 업데이트 수행 (신용카드 지출 등은 assetId가 없을 수 있음)
      if (sanitizedAssetId) {
        const [asset] = await db
          .select()
          .from(assets)
          .where(eq(assets.id, sanitizedAssetId));
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
            .where(eq(assets.id, sanitizedAssetId));
        }
      }

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
      // 자산 잔액 복구
      // assetId가 있는 경우에만 복구 (Card 사용 등은 null일 수 있음)
      if (tx.assetId) {
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
        }
      }

      // 이체였을 경우 대상 자산도 복구 (Source Asset 존재 여부와 무관하게 처리)
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

      await db.delete(transactions).where(eq(transactions.id, id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    // 상세한 에러 로깅
    console.error("[transactions error]", {
      requestId,
      method: req.method,
      url: req.url,
      body: req.body,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
    return sendError(res, requestId, error);
  }
}
