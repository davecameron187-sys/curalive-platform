import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { trpc } from "../lib/trpc";

/**
 * Authentication Hook
 * Manages user authentication state and token persistence
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const authMe = trpc.auth.me.useQuery(undefined, {
    enabled: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (token) {
        setIsAuthenticated(true);
        // Fetch user data
        const response = await authMe.refetch();
        if (response.data) {
          setUser(response.data);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Call login endpoint
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        await SecureStore.setItemAsync("auth_token", data.token);
        setIsAuthenticated(true);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("auth_token");
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return {
    isAuthenticated,
    loading,
    user,
    login,
    logout,
  };
}
