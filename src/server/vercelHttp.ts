import type { VercelRequest, VercelResponse } from "@vercel/node";

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function setCorsHeaders(res: VercelResponse) {
  // 이 앱은 인증 쿠키/세션을 사용하지 않으므로 credentials를 열지 않습니다.
  // (credentials=true 와 origin="*" 조합은 브라우저에서 무효 처리될 수 있음)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export function getRequestId(req: VercelRequest): string {
  const vercelId = req.headers["x-vercel-id"];
  if (typeof vercelId === "string" && vercelId.trim().length > 0) return vercelId;
  // node/edge 모두에서 동작하도록 Web Crypto 기반 UUID를 우선 사용
  const uuid =
    (globalThis as any)?.crypto?.randomUUID?.() ??
    `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return uuid;
}

type PublicErrorBody = {
  error: string;
  code: string;
  requestId: string;
};

export function sendError(
  res: VercelResponse,
  requestId: string,
  err: unknown
) {
  // Vercel에서는 Preview 배포도 NODE_ENV=production 인 경우가 많아,
  // 실제 노출 여부는 VERCEL_ENV(production|preview|development)로 판단합니다.
  const isProd = process.env.VERCEL_ENV === "production";

  const status =
    err instanceof HttpError
      ? err.status
      : typeof (err as any)?.status === "number"
        ? (err as any).status
        : 500;

  const code =
    err instanceof HttpError
      ? err.code
      : typeof (err as any)?.code === "string"
        ? (err as any).code
        : "INTERNAL_ERROR";

  // 서버 로그에는 상세를 남기되, 클라이언트에는 과도한 내부 정보를 노출하지 않음
  console.error("[api_error]", { requestId, code, status, err });

  const body: PublicErrorBody = {
    error: isProd ? "서버 오류가 발생했습니다." : String((err as any)?.message ?? err),
    code,
    requestId,
  };

  return res.status(status).json(body);
}


