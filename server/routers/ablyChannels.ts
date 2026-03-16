import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";

/**
 * Ably Channels Router
 * Provides real-time channel management for marketplace features
 */

export const ablyChannelsRouter = router({
  /**
   * Get Ably token for client-side real-time connections
   */
  getToken: protectedProcedure.query(async ({ ctx }) => {
    try {
      const apiKey = process.env.ABLY_API_KEY;
      if (!apiKey) {
        throw new Error("Ably API key not configured");
      }

      const [keyName, keySecret] = apiKey.split(":");
      const timestamp = Date.now();
      const ttl = 3600 * 1000; // 1 hour
      const nonce = Math.random().toString(36).substring(2, 15);
      const clientId = `user-${ctx.user.id}`;

      // Capability for recommendations and moderation channels
      const capability = JSON.stringify({
        "marketplace-recommendations": ["subscribe", "history"],
        "marketplace-moderation": ["subscribe", "history"],
        [`user-${ctx.user.id}-notifications`]: ["subscribe", "history"],
      });

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
    } catch (error) {
      console.error("[Ably] Error generating token:", error);
      throw error;
    }
  }),

  /**
   * Subscribe to recommendations channel
   */
  subscribeRecommendations: protectedProcedure.query(async ({ ctx }) => {
    return {
      channel: "marketplace-recommendations",
      clientId: `user-${ctx.user.id}`,
      capabilities: ["subscribe", "history"],
    };
  }),

  /**
   * Subscribe to moderation channel (admin only)
   */
  subscribeModeration: adminProcedure.query(async ({ ctx }) => {
    return {
      channel: "marketplace-moderation",
      clientId: `admin-${ctx.user.id}`,
      capabilities: ["subscribe", "history"],
    };
  }),

  /**
   * Publish recommendation update (internal use)
   */
  publishRecommendation: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        templateName: z.string(),
        score: z.number(),
        reason: z.string(),
        type: z.enum(["personalized", "trending", "similar", "collaborative"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // In production, this would publish to Ably
        // For now, we just return success
        return {
          success: true,
          message: `Recommendation published: ${input.templateName}`,
        };
      } catch (error) {
        console.error("[Ably] Error publishing recommendation:", error);
        throw error;
      }
    }),

  /**
   * Publish moderation update (admin only)
   */
  publishModeration: adminProcedure
    .input(
      z.object({
        templateId: z.number(),
        templateName: z.string(),
        action: z.string(),
        type: z.enum(["flagged", "approved", "rejected", "removed"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // In production, this would publish to Ably
        // For now, we just return success
        return {
          success: true,
          message: `Moderation action published: ${input.action}`,
          moderatorId: ctx.user.id,
        };
      } catch (error) {
        console.error("[Ably] Error publishing moderation update:", error);
        throw error;
      }
    }),
});
