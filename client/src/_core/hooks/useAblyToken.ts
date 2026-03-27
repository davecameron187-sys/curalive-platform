/**
 * useAblyToken — Automatic Ably Token Refresh Hook
 * 
 * Manages Ably token lifecycle with automatic refresh before expiry
 * - Requests token from /api/ably-auth
 * - Refreshes token at 50% of TTL (30 minutes for 1-hour tokens)
 * - Handles reconnection on token expiry
 * - Provides token status and error handling
 */

import { useEffect, useState, useCallback, useRef } from "react";

interface AblyToken {
  token: string;
  clientId: string;
  expiresAt: number;
}

interface UseAblyTokenResult {
  token: string | null;
  clientId: string | null;
  isLoading: boolean;
  error: Error | null;
  isExpired: boolean;
  refreshToken: () => Promise<void>;
}

export function useAblyToken(): UseAblyTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const expiresAtRef = useRef<number>(0);

  const requestToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/ably-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to get Ably token: ${response.statusText}`);
      }

      const data: AblyToken = await response.json();

      setToken(data.token);
      setClientId(data.clientId);
      setIsExpired(false);
      expiresAtRef.current = data.expiresAt;

      // Schedule refresh at 50% of TTL
      const now = Date.now();
      const ttl = data.expiresAt - now;
      const refreshAt = ttl * 0.5; // Refresh at 50% of TTL

      // Clear existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Schedule next refresh
      refreshTimeoutRef.current = setTimeout(async () => {
        await requestToken();
      }, refreshAt);

      console.log(`[Ably Token] Refreshed. Next refresh in ${(refreshAt / 1000 / 60).toFixed(1)} minutes`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsExpired(true);
      console.error("[Ably Token] Error:", error);

      // Retry after 5 seconds on error
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(async () => {
        await requestToken();
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial token request
  useEffect(() => {
    requestToken();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [requestToken]);

  // Monitor token expiry
  useEffect(() => {
    const checkExpiry = setInterval(() => {
      if (expiresAtRef.current && Date.now() >= expiresAtRef.current) {
        setIsExpired(true);
        console.warn("[Ably Token] Token expired, requesting new token");
        requestToken();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkExpiry);
  }, [requestToken]);

  return {
    token,
    clientId,
    isLoading,
    error,
    isExpired,
    refreshToken: requestToken,
  };
}
