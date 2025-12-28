import admin from "firebase-admin";

/**
 * Firebase Admin SDK Singleton
 *
 * Initializes Firebase Admin SDK for server-side authentication.
 * Used in Vercel Serverless Functions for token verification.
 */

let firebaseAdmin: admin.app.App;

export function getFirebaseAdmin(): admin.app.App {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  // Validate environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in environment variables."
    );
  }

  try {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"), // Handle escaped newlines
      }),
    });

    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    // If already initialized, get the existing app
    if (error instanceof Error && error.message.includes("already exists")) {
      firebaseAdmin = admin.app();
      console.log("✅ Firebase Admin SDK already initialized");
    } else {
      console.error("❌ Firebase Admin SDK initialization failed:", error);
      throw error;
    }
  }

  return firebaseAdmin;
}

export function getAuth(): admin.auth.Auth {
  const app = getFirebaseAdmin();
  return app.auth();
}
