import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ─── Ably Token Request ───────────────────────────────────────────────────────
// Generates a short-lived Ably token request so the browser never sees the API key.
// The client exchanges this token request with Ably's auth servers directly.
async function createAblyTokenRequest(clientId: string) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    // No Ably key configured — return a mock token request for demo mode
    return null;
  }

  const [keyName, keySecret] = apiKey.split(":");
  const timestamp = Date.now();
  const ttl = 3600 * 1000; // 1 hour
  const nonce = Math.random().toString(36).substring(2, 15);
  const capability = JSON.stringify({ [`chorus-event-*`]: ["subscribe", "publish", "presence", "history"] });

  // Build the HMAC-SHA256 signature
  const { createHmac } = await import("crypto");
  const signString = [keyName, ttl, nonce, clientId, timestamp, capability, ""].join("\n");
  const mac = createHmac("sha256", keySecret).update(signString).digest("base64");

  return {
    keyName,
    ttl,
    nonce,
    clientId,
    timestamp,
    capability,
    mac,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Ably real-time token endpoint — called by AblyContext on mount
  ably: router({
    tokenRequest: publicProcedure
      .input(z.object({ clientId: z.string().optional().default("anonymous") }))
      .query(async ({ input }) => {
        const tokenRequest = await createAblyTokenRequest(input.clientId);
        return {
          tokenRequest,
          // If no API key is configured, tell the client to use demo (in-memory) mode
          mode: tokenRequest ? "ably" : "demo",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
