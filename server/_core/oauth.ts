import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  const oauthEnabled = Boolean(process.env.OAUTH_SERVER_URL);

  app.get("/api/auth/status", async (req: Request, res: Response) => {
    const mode = oauthEnabled ? "oauth" : "dev-bypass";
    const env = (process.env.NODE_ENV || "").trim();
    const bypassEnabled = (process.env.AUTH_BYPASS || "").trim() === "true";
    const isStaging = env === "staging" || env === "test";
    const isDev = env === "development" || env === "";
    const DEV_BYPASS = (isStaging || isDev) && bypassEnabled;

    const DEV_USER = {
      id: 1,
      name: "Dev Operator",
      email: "dev@curalive.local",
      role: "admin"
    };

    let user = null;

    try {
      const sessionUser = await sdk.authenticateRequest(req);
      if (sessionUser) {
        user = { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email, role: sessionUser.role };
      }
    } catch (e) {
      console.error("[AuthStatus] Auth check failed", e);
    }

    if (!user && DEV_BYPASS) {
      user = DEV_USER;
    }

    res.json({
      authenticated: Boolean(user),
      mode,
      user,
      oauthConfigured: oauthEnabled,
    });
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    if (!oauthEnabled) {
      res.status(503).json({ error: "OAuth is not configured. Set OAUTH_SERVER_URL to enable authentication." });
      return;
    }

    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
