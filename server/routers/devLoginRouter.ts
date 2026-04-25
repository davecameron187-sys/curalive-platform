import { Router } from "express";
import * as db from "../db";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";

const ALLOWED_OPEN_IDS = ["test-customer-001", "test-operator-001", "dev-bypass-operator"];

export function registerDevLoginRoute(app: Router) {
  app.get("/api/dev/login", async (req: any, res: any) => {
    const enabled = process.env.DEV_LOGIN_ENABLED === "true";
    const secret = process.env.DEV_LOGIN_SECRET;
    const { openId, secret: reqSecret } = req.query;

    if (!enabled) {
      return res.status(403).json({ error: "Dev login not enabled" });
    }
    if (!secret || reqSecret !== secret) {
      return res.status(403).json({ error: "Invalid secret" });
    }
    if (!openId || !ALLOWED_OPEN_IDS.includes(openId as string)) {
      return res.status(403).json({ error: "openId not allowed" });
    }

    try {
      const user = await db.getUserByOpenId(openId as string);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const sessionToken = await sdk.createSessionToken(openId as string, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log(`[DEV LOGIN] issued session for openId=${openId} role=${user.role}`);
      return res.redirect(302, "/");
    } catch (err) {
      console.error("[DEV LOGIN] failed:", err);
      return res.status(500).json({ error: "Failed to issue session" });
    }
  });
}
