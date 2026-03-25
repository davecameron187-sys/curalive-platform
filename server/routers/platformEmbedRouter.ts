import { z } from "zod";
import { router, publicProcedure, operatorProcedure } from "../_core/trpc";
import {
  generateShareLink,
  getEmbedCode,
  trackEmbedShare,
  getShareAnalytics,
  generateEventSummary,
} from "../services/PlatformEmbedService";

export const platformEmbedRouter = router({
  generateShareLink: operatorProcedure
    .input(
      z.object({
        sessionId: z.number(),
        sessionCode: z.string(),
        platform: z.enum(["zoom", "teams", "webex", "meet", "generic"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const baseUrl = `${ctx.req.protocol}://${ctx.req.get("host")}`;
      return generateShareLink(
        input.sessionId,
        input.sessionCode,
        input.platform,
        baseUrl
      );
    }),

  getEmbedCode: operatorProcedure
    .input(
      z.object({
        sessionCode: z.string(),
        whiteLabel: z.boolean().optional(),
        brandName: z.string().optional(),
        brandColor: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        hideBranding: z.boolean().optional(),
      })
    )
    .query(({ input, ctx }) => {
      const baseUrl = `${ctx.req.protocol}://${ctx.req.get("host")}`;
      return {
        embedCode: getEmbedCode(input.sessionCode, baseUrl, {
          whiteLabel: input.whiteLabel,
          brandName: input.brandName,
          brandColor: input.brandColor,
          width: input.width,
          height: input.height,
          hideBranding: input.hideBranding,
        }),
      };
    }),

  trackShare: operatorProcedure
    .input(
      z.object({
        sessionId: z.number(),
        platform: z.enum(["zoom", "teams", "webex", "meet", "generic"]),
        shareType: z.enum(["link", "embed", "widget"]),
        shareLink: z.string(),
        whiteLabel: z.boolean().optional(),
        brandName: z.string().optional(),
        brandColor: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await trackEmbedShare(
        input.sessionId,
        input.platform,
        input.shareType,
        input.shareLink,
        input.whiteLabel,
        input.brandName,
        input.brandColor
      );
      return { success: true };
    }),

  getShareAnalytics: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      return getShareAnalytics(input.sessionId);
    }),

  getEventSummary: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      return generateEventSummary(input.sessionId);
    }),

});
