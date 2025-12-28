import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { setAuthToken } from "@/lib/api";

interface AuthContextType {
  user: FirebaseUser | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Check if user exists, if not create user
      try {
        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (response.status === 401 && response.statusText === "USER_NOT_FOUND") {
          // User doesn't exist, create new user
          await fetch("/api/users", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
        }
      } catch (error) {
        console.error("Error checking/creating user:", error);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      setAuthToken(null); // Clear API token
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Get ID token
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        setAuthToken(idToken); // Set token for API calls

        // Check if user exists in database, if not create user
        try {
          const response = await fetch("/api/users/me", {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          // If user doesn't exist (401), create new user
          if (!response.ok && response.status === 401) {
            console.log("User not found in database, creating...");
            const createResponse = await fetch("/api/users", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            });

            if (!createResponse.ok) {
              console.error("Failed to create user:", await createResponse.text());
            } else {
              console.log("User created successfully");
            }
          }
        } catch (error) {
          console.error("Error checking/creating user:", error);
        }
      } else {
        setToken(null);
        setAuthToken(null); // Clear API token
      }

      setLoading(false);
    });

    // Set up token refresh every 45 minutes (Firebase tokens expire after 1 hour)
    const tokenRefreshInterval = setInterval(
      async () => {
        if (auth.currentUser) {
          try {
            const newToken = await auth.currentUser.getIdToken(true); // Force refresh
            setToken(newToken);
            setAuthToken(newToken); // Update API token
            console.log("Token refreshed");
          } catch (error) {
            console.error("Error refreshing token:", error);
          }
        }
      },
      45 * 60 * 1000
    ); // 45 minutes

    return () => {
      unsubscribe();
      clearInterval(tokenRefreshInterval);
    };
  }, []);

  const value = {
    user,
    token,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
