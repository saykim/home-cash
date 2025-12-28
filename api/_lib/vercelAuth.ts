import { eq } from "drizzle-orm";
import { HttpError } from "./vercelHttp.js";
import { users } from "../db-schema.js";

/**
 * Shared mode (단일 데이터셋 공유)
 * - 서버는 Firebase Admin 검증을 하지 않습니다. (환경변수/키 설정 부담 제거)
 * - 프런트에서 로그인 후 Authorization 헤더(Bearer)를 붙이는 것만 요구합니다.
 * - DB 작업을 위한 userId는 아래 우선순위로 결정합니다:
 *   1) env `SHARED_USER_ID` (있으면 그대로 사용)
 *   2) users 테이블의 첫 번째 사용자 id
 *   3) users 테이블이 비어있으면 "shared" 사용자 1개를 생성
 */
async function resolveSharedUserId(db) {
  const envUserId =
    typeof process.env.SHARED_USER_ID === "string"
      ? process.env.SHARED_USER_ID.trim()
      : "";
  if (envUserId) return envUserId;

  const existing = await db.select().from(users).limit(1);
  if (existing && existing.length > 0) return existing[0].id;

  const created = await db
    .insert(users)
    .values({
      firebaseUid: "shared",
      email: "shared@local",
      displayName: "Shared User",
      photoURL: null,
    })
    .returning();

  if (!created || created.length === 0) {
    throw new HttpError(500, "SHARED_USER_CREATE_FAILED", "Failed to create user");
  }

  return created[0].id;
}

/**
 * Authentication Middleware for Vercel Serverless Functions
 *
 * Verifies Firebase ID token from Authorization header and returns the user ID.
 *
 * @param req - Vercel request object
 * @param db - Drizzle database instance
 * @returns User ID from database
 * @throws HttpError(401) if token is invalid or user not found
 */
export async function verifyAuth(req, db) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(
        401,
        "MISSING_TOKEN",
        "Authorization header with Bearer token is required"
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token || token.trim().length === 0) {
      throw new HttpError(401, "INVALID_TOKEN", "Token is empty");
    }

    // 2. Shared mode: 토큰의 유효성은 서버에서 검증하지 않고(테스트용),
    //    DB userId는 단일 공유 사용자로 매핑합니다.
    return await resolveSharedUserId(db);
  } catch (error) {
    // Re-throw HttpError as-is
    if (error instanceof HttpError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error("[verifyAuth] Unexpected error:", error);
    throw new HttpError(500, "AUTH_ERROR", "Authentication failed");
  }
}

/**
 * Optional: Verify auth and also check resource ownership
 *
 * @param req - Vercel request object
 * @param db - Drizzle database instance
 * @param resourceUserId - The userId of the resource being accessed
 * @returns User ID from database
 * @throws HttpError(403) if user doesn't own the resource
 */
export async function verifyAuthAndOwnership(req, db, resourceUserId) {
  const userId = await verifyAuth(req, db);

  if (userId !== resourceUserId) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "You do not have permission to access this resource"
    );
  }

  return userId;
}
