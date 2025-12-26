// Vercel Serverless Function 공통 유틸 (TS 파일이지만 "순수 JS 문법"만 사용)
// - 이유: Vercel 런타임에서 종종 api 외부/일부 TS 의존 파일이 트랜스파일 없이 로드되어
//   타입 주석/필드 타입 등 TS 문법이 있으면 FUNCTION_INVOCATION_FAILED로 크래시할 수 있음.

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function setCorsHeaders(res) {
  // 인증 쿠키/세션을 사용하지 않으므로 credentials는 열지 않습니다.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export function getRequestId(req) {
  const vercelId = req?.headers?.["x-vercel-id"];
  if (typeof vercelId === "string" && vercelId.trim().length > 0) return vercelId;

  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();

  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function sendError(res, requestId, err) {
  // Vercel Preview도 NODE_ENV=production인 경우가 많음 → VERCEL_ENV로 판별
  const isProd = process.env.VERCEL_ENV === "production";

  const status =
    err && typeof err.status === "number"
      ? err.status
      : err instanceof HttpError
        ? err.status
        : 500;

  const code =
    err && typeof err.code === "string"
      ? err.code
      : err instanceof HttpError
        ? err.code
        : "INTERNAL_ERROR";

  console.error("[api_error]", { requestId, code, status, err });

  return res.status(status).json({
    error: isProd ? "서버 오류가 발생했습니다." : String(err?.message ?? err),
    code,
    requestId,
  });
}


