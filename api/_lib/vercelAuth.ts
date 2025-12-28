import { eq } from "drizzle-orm";
import { getAuth } from "./firebaseAdmin.js";
import { HttpError } from "./vercelHttp.js";
import { users } from "../db-schema.js";

function parseAllowList(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

const sharedAuthConfig = (() => {
  const userId =
    typeof process.env.SHARED_USER_ID === "string"
      ? process.env.SHARED_USER_ID.trim()
      : "";
  const allowedEmails = parseAllowList(process.env.SHARED_ALLOWED_EMAILS);

  return {
    enabled: userId.length > 0 && allowedEmails.length > 0,
    userId: userId.length > 0 ? userId : null,
    allowedEmails,
  };
})();

async function tryResolveSharedUserId(decodedToken, db) {
  if (!sharedAuthConfig.enabled) {
    return null;
  }

  const tokenEmail =
    typeof decodedToken.email === "string"
      ? decodedToken.email.trim().toLowerCase()
      : "";

  if (!tokenEmail || !sharedAuthConfig.allowedEmails.includes(tokenEmail)) {
    return null;
  }

  const sharedUser = await db
    .select()
    .from(users)
    .where(eq(users.id, sharedAuthConfig.userId))
    .limit(1);

  if (!sharedUser || sharedUser.length === 0) {
    throw new HttpError(
      500,
      "SHARED_USER_NOT_FOUND",
      "Shared user ID not found in database"
    );
  }

  return sharedAuthConfig.userId;
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

    // 2. Verify Firebase token
    const auth = getAuth();
    let decodedToken;

    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error("[verifyAuth] Token verification failed:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/id-token-expired") {
        throw new HttpError(401, "TOKEN_EXPIRED", "Token has expired");
      } else if (error.code === "auth/argument-error") {
        throw new HttpError(401, "INVALID_TOKEN", "Invalid token format");
      } else {
        throw new HttpError(401, "INVALID_TOKEN", "Token verification failed");
      }
    }

    const sharedUserId = await tryResolveSharedUserId(decodedToken, db);
    if (sharedUserId) {
      return sharedUserId;
    }

    const firebaseUid = decodedToken.uid;

    if (!firebaseUid) {
      throw new HttpError(
        401,
        "INVALID_TOKEN",
        "Token does not contain user ID"
      );
    }

    // 3. Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    if (!userResult || userResult.length === 0) {
      throw new HttpError(
        401,
        "USER_NOT_FOUND",
        "User not found. Please sign up first."
      );
    }

    const user = userResult[0];

    // 4. Return internal user ID
    return user.id;
  } catch (error) {
    // Re-throw HttpError as-is
    if (error instanceof HttpError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error("[verifyAuth] Unexpected error:", error);
    throw new HttpError(401, "AUTH_ERROR", "Authentication failed");
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
