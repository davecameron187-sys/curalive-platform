/**
 * Ably Authentication Service
 * 
 * Provides token authentication for Ably real-time subscriptions.
 * Clients request tokens from this endpoint and use them to connect to Ably channels.
 */

import Ably from "ably";
import type { TrpcContext } from "./context";

/**
 * Generate an Ably auth token for the current user
 * 
 * @param ctx - tRPC context with user info
 * @returns Ably token request object
 */
export async function generateAblyToken(ctx: TrpcContext | any) {
  if (!ctx?.user?.id) {
    throw new Error("User must be authenticated to request Ably token");
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    throw new Error("ABLY_API_KEY environment variable not set");
  }

  try {
    const client = new Ably.Rest({ key: apiKey });

    // Generate token request with user-specific capabilities
    const tokenRequest = await client.auth.createTokenRequest({
      clientId: ctx.user?.id?.toString() || "anonymous",
      ttl: 3600000, // 1 hour
      capability: {
        // Allow subscribing to session-specific channels
        "session:*:state": ["subscribe"],
        "session:*:actions": ["subscribe"],
        "session:*:qa": ["subscribe"],
        "session:*:metrics": ["subscribe"],
        // Allow publishing to user-specific channels
        [`user:${ctx.user.id}:*`]: ["publish", "subscribe"],
      },
    });

    return tokenRequest;
  } catch (error) {
    console.error("[AblyAuth] Token generation error:", error);
    throw new Error("Failed to generate Ably token");
  }
}

/**
 * Verify Ably token validity
 * 
 * @param token - Ably token to verify
 * @returns true if token is valid
 */
export function verifyAblyToken(token: string): boolean {
  try {
    // In production, verify the token signature
    // For now, just check that it exists and is a string
    return typeof token === "string" && token.length > 0;
  } catch (error) {
    console.error("[AblyAuth] Token verification error:", error);
    return false;
  }
}

/**
 * Express middleware for Ably token requests
 * 
 * Handles POST /api/ably-auth requests
 */
export async function ablyAuthHandler(req: any, res: any) {
  try {
    // Get user from session
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Create context for token generation
    const ctx: any = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };

    const tokenRequest = await generateAblyToken(ctx);

    res.json(tokenRequest);
  } catch (error) {
    console.error("[AblyAuth] Handler error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
}
