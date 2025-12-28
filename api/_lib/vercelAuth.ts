import { eq } from "drizzle-orm";
import { getAuth } from "./firebaseAdmin";
import { HttpError } from "./vercelHttp";
import { users } from "../db-schema";

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

    const firebaseUid = decodedToken.uid;

    if (!firebaseUid) {
      throw new HttpError(401, "INVALID_TOKEN", "Token does not contain user ID");
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
