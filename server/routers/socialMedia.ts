import { z } from "zod";
import { router, protectedProcedure, operatorProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { socialMediaService } from "../services/SocialMediaService";
import { eventEchoPipeline } from "../services/EventEchoPipeline";
import { complianceModerator } from "../services/ComplianceModerator";
import { buildOAuthUrl, OAUTH_CONFIGS, isPlatformConfigured, getConfiguredPlatforms, type SocialPlatform } from "../_core/socialOAuth";
import { getDb } from "../db";
import { socialMediaAccounts, socialPosts, socialMetrics } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const PLATFORMS = ["linkedin", "twitter", "facebook", "instagram", "tiktok"] as const;

export const socialMediaRouter = router({
  getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await socialMediaService.getLinkedAccounts(ctx.user.id);
    return accounts.map((a) => ({
      ...a,
      accessToken: undefined,
      refreshToken: undefined,
      configured: isPlatformConfigured(a.platform),
      platformConfig: {
        displayName: OAUTH_CONFIGS[a.platform].displayName,
        color: OAUTH_CONFIGS[a.platform].color,
        charLimit: OAUTH_CONFIGS[a.platform].charLimit,
      },
    }));
  }),

  getPlatformStatus: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await socialMediaService.getLinkedAccounts(ctx.user.id);
    return (Object.keys(OAUTH_CONFIGS) as SocialPlatform[]).map((platform) => {
      const linked = accounts.find((a) => a.platform === platform);
      return {
        platform,
        displayName: OAUTH_CONFIGS[platform].displayName,
        color: OAUTH_CONFIGS[platform].color,
        configured: isPlatformConfigured(platform),
        linked: !!linked,
        accountName: linked?.accountName ?? null,
        accountHandle: linked?.accountHandle ?? null,
        avatarUrl: linked?.avatarUrl ?? null,
        accountDbId: linked?.id ?? null,
        charLimit: OAUTH_CONFIGS[platform].charLimit,
        supportsImages: OAUTH_CONFIGS[platform].supportsImages,
        supportsVideo: OAUTH_CONFIGS[platform].supportsVideo,
      };
    });
  }),

  getOAuthUrl: protectedProcedure
    .input(z.object({ platform: z.enum(PLATFORMS) }))
    .query(async ({ ctx, input }) => {
      if (!isPlatformConfigured(input.platform)) {
        return {
          url: null,
          configured: false,
          message: `${OAUTH_CONFIGS[input.platform].displayName} OAuth not configured. Set ${OAUTH_CONFIGS[input.platform].clientIdEnvKey} and ${OAUTH_CONFIGS[input.platform].clientSecretEnvKey} environment variables.`,
        };
      }
      const redirectUri = `${process.env.REPLIT_DEV_DOMAIN ?? "http://localhost:5000"}/api/social/oauth/callback/${input.platform}`;
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, platform: input.platform })).toString("base64");
      const url = buildOAuthUrl(input.platform, redirectUri, state);
      return { url, configured: true, message: null };
    }),

  unlinkAccount: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await socialMediaService.unlinkAccount(ctx.user.id, input.accountId);
      await complianceModerator.logAction(ctx.user.id, "unlink_account", {
        details: `Unlinked account id=${input.accountId}`,
      });
      return { success: true };
    }),

  linkDemoAccount: protectedProcedure
    .input(z.object({
      platform: z.enum(PLATFORMS),
      accountName: z.string(),
      accountHandle: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const account = await socialMediaService.linkAccount(
        ctx.user.id,
        input.platform,
        `demo_${input.platform}_${ctx.user.id}`,
        input.accountName,
        `demo_token_${Date.now()}`,
        {
          accountHandle: input.accountHandle ?? `@${input.accountName.toLowerCase().replace(/\s+/g, "")}`,
        }
      );
      await complianceModerator.logAction(ctx.user.id, "link_account", {
        platform: input.platform,
        details: `Demo linked: ${input.accountName}`,
      });
      return account;
    }),

  createPost: protectedProcedure
    .input(z.object({
      content: z.string().min(1).max(63206),
      platforms: z.array(z.enum(PLATFORMS)).min(1),
      eventId: z.number().optional(),
      scheduledAt: z.string().datetime().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const post = await socialMediaService.createPost(ctx.user.id, {
        content: input.content,
        platforms: input.platforms,
        eventId: input.eventId,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      });
      await complianceModerator.logAction(ctx.user.id, "create_post", {
        postId: post.id,
        details: `Created ${input.platforms.join(", ")} post`,
      });
      return post;
    }),

  listPosts: protectedProcedure
    .input(z.object({
      eventId: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return socialMediaService.getPosts(ctx.user.id, input);
    }),

  generateEchoPost: protectedProcedure
    .input(z.object({
      eventId: z.number(),
      platforms: z.array(z.enum(PLATFORMS)).min(1).default(["linkedin", "twitter"]),
      customContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const echoResult = await eventEchoPipeline.processEvent(input.eventId);
        return {
          success: true,
          posts: echoResult.posts,
          eventTitle: echoResult.eventTitle,
          sourceData: echoResult.sourceData.slice(0, 500),
          generatedAt: echoResult.generatedAt,
        };
      } catch (err: any) {
        const demoResult = await eventEchoPipeline.generateFromText(
          input.customContext ?? "A successful investor event with strong Q&A engagement and positive sentiment.",
          "CuraLive Event",
          { type: "event_summary", label: "Event Summary" },
          input.platforms
        );
        return {
          success: true,
          posts: demoResult,
          eventTitle: "CuraLive Event",
          sourceData: "Demo generation",
          generatedAt: new Date(),
        };
      }
    }),

  moderatePost: operatorProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await socialMediaService.moderateAndApprove(input.postId, ctx.user.id);
      return result;
    }),

  moderateContent: protectedProcedure
    .input(z.object({ content: z.string(), eventContext: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const result = await complianceModerator.moderate(input.content, input.eventContext);
      await complianceModerator.logAction(ctx.user.id, "moderate_content", {
        details: `Content check: ${result.approved ? "approved" : "flagged"} — ${result.flags.length} flags`,
      });
      return result;
    }),

  publishPost: operatorProcedure
    .input(z.object({
      postId: z.number(),
      accountIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const accounts = await db
        .select()
        .from(socialMediaAccounts)
        .where(
          and(
            eq(socialMediaAccounts.userId, ctx.user.id),
            eq(socialMediaAccounts.isActive, true)
          )
        );

      const selected = accounts.filter((a) => input.accountIds.includes(a.id));
      if (selected.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No valid accounts found" });

      const results = await socialMediaService.publishPost(input.postId, ctx.user.id, selected);
      return { results, publishedCount: results.filter((r) => r.success).length };
    }),

  getPostMetrics: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      return socialMediaService.getMetrics(input.postId);
    }),

  getEventSocialROI: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      return socialMediaService.generateROIInsight(input.eventId);
    }),

  getAggregateAnalytics: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalPosts: 0, totalEngagement: 0, topPlatform: null, avgEngagementRate: 0 };

      const posts = await db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.createdBy, ctx.user.id))
        .orderBy(desc(socialPosts.createdAt))
        .limit(100);

      const published = posts.filter((p) => p.status === "published");
      const byPlatform: Record<string, number> = {};

      for (const post of published) {
        try {
          const platforms = JSON.parse(post.platforms ?? "[]");
          for (const p of platforms) {
            byPlatform[p] = (byPlatform[p] ?? 0) + 1;
          }
        } catch {}
      }

      const topPlatform = Object.entries(byPlatform).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return {
        totalPosts: posts.length,
        publishedPosts: published.length,
        draftPosts: posts.filter((p) => p.status === "draft" || p.status === "pending_approval").length,
        topPlatform,
        platformBreakdown: byPlatform,
        aiGeneratedCount: posts.filter((p) => p.aiGenerated).length,
      };
    }),
});
