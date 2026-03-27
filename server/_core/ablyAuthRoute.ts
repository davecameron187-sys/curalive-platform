/**
 * Ably Auth Route Handler
 * 
 * Express route for POST /api/ably-auth
 * Issues Ably tokens for authenticated users
 */

import { Express, Request, Response } from "express";
import Ably from "ably";
import { sdk } from "./sdk";

/**
 * Register Ably auth route with Express app
 */
export function registerAblyAuthRoute(app: Express) {
  app.post("/api/ably-auth", async (req: Request, res: Response) => {
    try {
      // Authenticate the request
      const user = await sdk.authenticateRequest(req);

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get Ably API key
      const apiKey = process.env.ABLY_API_KEY;
      if (!apiKey) {
        console.error("[AblyAuth] ABLY_API_KEY not configured");
        return res.status(500).json({ error: "Ably configuration error" });
      }

      try {
        // Create Ably REST client
        const client = new Ably.Rest({ key: apiKey });

        // Generate token request with user-specific capabilities
        const tokenRequest = await client.auth.createTokenRequest({
          clientId: user.id.toString(),
          ttl: 3600000, // 1 hour
          capability: {
            // Subscribe to session-specific channels
            "session:*:state": ["subscribe"],
            "session:*:actions": ["subscribe"],
            "session:*:qa": ["subscribe"],
            "session:*:metrics": ["subscribe"],
            "session:*:transcript": ["subscribe"],
            
            // Publish to user-specific channels
            [`user:${user.id}:*`]: ["publish", "subscribe"],
            
            // Subscribe to operator channels
            "operator:*": ["subscribe"],
          },
        });

        // Return token request to client
        res.json(tokenRequest);
      } catch (ablyError) {
        console.error("[AblyAuth] Token generation failed:", ablyError);
        res.status(500).json({ error: "Failed to generate token" });
      }
    } catch (error) {
      console.error("[AblyAuth] Route error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  console.log("[AblyAuth] Route registered: POST /api/ably-auth");
}

/**
 * Middleware to validate Ably token in requests
 */
export function validateAblyToken(req: Request, res: Response, next: Function) {
  const token = req.headers["x-ably-token"];

  if (!token || typeof token !== "string") {
    return res.status(401).json({ error: "Missing or invalid Ably token" });
  }

  // Token validation would happen here
  // For now, just pass through
  next();
}
