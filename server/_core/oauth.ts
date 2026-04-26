// server/_core/oauth.ts
// CuraLive OAuth Routes — Clerk-backed implementation
// registerOAuthRoutes export must remain — index.ts depends on it.
// Clerk middleware registered here. Auth logic lives in auth.ts only.

import type { Express, Request, Response } from "express";
import { clerkMiddleware, getCurrentUser } from "./auth";

export function registerOAuthRoutes(app: Express) {
  // Register Clerk middleware scoped to /api only
  app.use("/api", clerkMiddleware());

  // Login — redirect to Clerk hosted sign-in
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    const signInBase = process.env.CLERK_SIGN_IN_URL;
    if (!signInBase) {
      res.status(500).send("Auth not configured");
      return;
    }

    const appOrigin =
      process.env.APP_ORIGIN ?? `${req.protocol}://${req.get("host")}`;

    const returnTo = req.query.returnTo;
    const redirectTarget =
      typeof returnTo === "string" && returnTo.startsWith("/")
        ? `${appOrigin}${returnTo}`
        : appOrigin;

    const signInUrl = new URL(signInBase);
    signInUrl.searchParams.set("redirect_url", redirectTarget);
    res.redirect(302, signInUrl.toString());
  });

  // Auth status — resolve CuraLive user from Clerk session
  app.get("/api/auth/status", async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    res.json({
      authenticated: Boolean(user),
      mode: "clerk",
      user: user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
            orgId: user.orgId,
          }
        : null,
      oauthConfigured: true,
    });
  });
}
