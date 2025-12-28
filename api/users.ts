import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { setCorsHeaders, sendError, getRequestId, HttpError } from "./_lib/vercelHttp.js";
import { getAuth } from "./_lib/firebaseAdmin.js";
import { verifyAuth } from "./_lib/vercelAuth.js";
import { users, categories, assets } from "./db-schema.js";

function createDb() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  return drizzle(sqlClient);
}

/**
 * User API
 *
 * POST /api/users - Sign up (create user + default categories + cash asset)
 * GET /api/users/me - Get current user info
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const requestId = getRequestId(req);
  const db = createDb();

  try {
    // POST /api/users - Sign up
    if (req.method === "POST") {
      // Extract token from Authorization header
      const authHeader = req.headers?.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new HttpError(
          401,
          "MISSING_TOKEN",
          "Authorization header with Bearer token is required"
        );
      }

      const token = authHeader.substring(7);

      // Verify Firebase token
      const auth = getAuth();
      let decodedToken;

      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (error) {
        console.error("[POST /api/users] Token verification failed:", error);
        throw new HttpError(401, "INVALID_TOKEN", "Invalid token");
      }

      const { uid, email, name, picture } = decodedToken;

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, uid))
        .limit(1);

      if (existingUser.length > 0) {
        // User already exists, return existing user
        return res.status(200).json(existingUser[0]);
      }

      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          firebaseUid: uid,
          email: email || "",
          displayName: name || null,
          photoURL: picture || null,
        })
        .returning();

      console.log(`✅ User created: ${newUser.id}`);

      // Create default categories
      const defaultCategories = [
        // Income categories
        { name: "급여", kind: "INCOME", icon: "💰", color: "#10b981" },
        { name: "부수입", kind: "INCOME", icon: "💵", color: "#34d399" },
        { name: "기타수입", kind: "INCOME", icon: "🎁", color: "#6ee7b7" },

        // Expense categories
        { name: "식비", kind: "EXPENSE", icon: "🍴", color: "#ef4444" },
        { name: "교통비", kind: "EXPENSE", icon: "🚗", color: "#f97316" },
        { name: "문화생활", kind: "EXPENSE", icon: "🎬", color: "#8b5cf6" },
        { name: "쇼핑", kind: "EXPENSE", icon: "🛍️", color: "#ec4899" },
        { name: "의료", kind: "EXPENSE", icon: "🏥", color: "#06b6d4" },
        { name: "기타지출", kind: "EXPENSE", icon: "📝", color: "#64748b" },
      ];

      await db.insert(categories).values(
        defaultCategories.map((cat) => ({
          ...cat,
          userId: newUser.id,
        }))
      );

      console.log(`✅ Default categories created for user: ${newUser.id}`);

      // Create initial cash asset
      await db.insert(assets).values({
        userId: newUser.id,
        name: "현금",
        type: "CASH",
        balance: "0",
        initialBalance: "0",
      });

      console.log(`✅ Initial cash asset created for user: ${newUser.id}`);

      return res.status(201).json(newUser);
    }

    // GET /api/users/me - Get current user
    if (req.method === "GET") {
      const userId = await verifyAuth(req, db);

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userResult || userResult.length === 0) {
        throw new HttpError(404, "USER_NOT_FOUND", "User not found");
      }

      return res.status(200).json(userResult[0]);
    }

    // Method not allowed
    throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
  } catch (error) {
    return sendError(res, requestId, error);
  }
}
