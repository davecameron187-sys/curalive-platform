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

  app.get("/api/oauth/login", (req: Request, res: Response) => {
    if (!oauthEnabled) {
      res.status(503).send(
        `<!DOCTYPE html><html><head><title>Login Unavailable</title>
        <style>body{font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#111}
        h1{color:#c00}code{background:#f4f4f4;padding:2px 6px;border-radius:4px;font-size:.9em}</style></head>
        <body><h1>Authentication Not Configured</h1>
        <p>The <code>OAUTH_SERVER_URL</code> environment variable is not set on this server.</p>
        <p>Add <code>OAUTH_SERVER_URL</code>, <code>APP_ID</code>, and <code>OWNER_OPEN_ID</code>
        to Render's environment settings to enable login.</p></body></html>`
      );
      return;
    }

    const appOrigin = process.env.APP_ORIGIN ?? `${req.protocol}://${req.get("host")}`;
    const callbackUrl = `${appOrigin}/api/oauth/callback`;
    const state = Buffer.from(callbackUrl).toString("base64");
    const returnTo = getQueryParam(req, "returnTo");

    try {
      const oauthBase = process.env.OAUTH_SERVER_URL!;
      const authUrl = new URL("/authorize", oauthBase);
      authUrl.searchParams.set("client_id", process.env.APP_ID ?? "");
      authUrl.searchParams.set("redirect_uri", callbackUrl);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("state", state);
      if (returnTo) authUrl.searchParams.set("returnTo", returnTo);
      res.redirect(302, authUrl.toString());
    } catch (err) {
      console.error("[OAuth] Failed to build login URL:", err);
      res.status(500).json({ error: "Failed to construct login URL" });
    }
  });

  app.get("/api/auth/status", async (req: Request, res: Response) => {
    const mode = oauthEnabled ? "oauth" : "dev-bypass";
    let user = null;

    try {
      const sessionUser = await sdk.authenticateRequest(req);
      if (sessionUser) {
        user = { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email, role: sessionUser.role };
      }
    } catch {}

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
