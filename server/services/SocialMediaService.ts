import { getDb } from "../db";
import {
  socialMediaAccounts,
  socialPosts,
  socialPostPlatforms,
  socialMetrics,
  type SocialMediaAccount,
  type SocialPost,
  type InsertSocialPost,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import type { SocialPlatform } from "../_core/socialOAuth";
import { complianceModerator } from "./ComplianceModerator";

export interface PublishResult {
  platform: SocialPlatform;
  success: boolean;
  externalPostId?: string;
  error?: string;
}

export class SocialMediaService {
  async getLinkedAccounts(userId: number): Promise<SocialMediaAccount[]> {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(socialMediaAccounts)
      .where(and(eq(socialMediaAccounts.userId, userId), eq(socialMediaAccounts.isActive, true)))
      .orderBy(desc(socialMediaAccounts.createdAt));
  }

  async linkAccount(
    userId: number,
    platform: SocialPlatform,
    accountId: string,
    accountName: string,
    accessToken: string,
    options: {
      refreshToken?: string;
      expiresAt?: Date;
      accountHandle?: string;
      avatarUrl?: string;
      linkedEvents?: number[];
    } = {}
  ): Promise<SocialMediaAccount> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db
      .insert(socialMediaAccounts)
      .values({
        userId,
        platform,
        accountId,
        accountName,
        accountHandle: options.accountHandle ?? null,
        avatarUrl: options.avatarUrl ?? null,
        accessToken,
        refreshToken: options.refreshToken ?? null,
        expiresAt: options.expiresAt ?? null,
        linkedEvents: options.linkedEvents ? JSON.stringify(options.linkedEvents) : null,
        isActive: true,
      })
      .onDuplicateKeyUpdate({
        set: {
          accountName,
          accessToken,
          refreshToken: options.refreshToken ?? null,
          expiresAt: options.expiresAt ?? null,
          isActive: true,
          updatedAt: new Date(),
        },
      });

    const accounts = await db
      .select()
      .from(socialMediaAccounts)
      .where(and(eq(socialMediaAccounts.userId, userId), eq(socialMediaAccounts.platform, platform), eq(socialMediaAccounts.accountId, accountId)))
      .limit(1);

    return accounts[0];
  }

  async unlinkAccount(userId: number, accountId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db
      .update(socialMediaAccounts)
      .set({ isActive: false })
      .where(and(eq(socialMediaAccounts.id, accountId), eq(socialMediaAccounts.userId, userId)));
  }

  async createPost(
    userId: number,
    data: {
      content: string;
      platforms: SocialPlatform[];
      eventId?: number;
      scheduledAt?: Date;
      aiGenerated?: boolean;
      echoSource?: string;
    }
  ): Promise<SocialPost> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.insert(socialPosts).values({
      eventId: data.eventId ?? null,
      createdBy: userId,
      content: data.content,
      aiGenerated: data.aiGenerated ?? false,
      echoSource: data.echoSource ?? null,
      platforms: JSON.stringify(data.platforms),
      scheduledAt: data.scheduledAt ?? null,
      status: data.scheduledAt ? "scheduled" : "draft",
      moderationStatus: "pending",
    });

    const posts = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.createdBy, userId))
      .orderBy(desc(socialPosts.createdAt))
      .limit(1);

    return posts[0];
  }

  async getPosts(
    userId: number,
    options: { eventId?: number; status?: string; limit?: number } = {}
  ): Promise<SocialPost[]> {
    const db = await getDb();
    if (!db) return [];

    let query = db.select().from(socialPosts).where(eq(socialPosts.createdBy, userId));

    return query.orderBy(desc(socialPosts.createdAt)).limit(options.limit ?? 20);
  }

  async moderateAndApprove(postId: number, userId: number): Promise<{ approved: boolean; notes: string }> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const posts = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
    const post = posts[0];
    if (!post) throw new Error("Post not found");

    const result = await complianceModerator.moderate(post.content);

    await db
      .update(socialPosts)
      .set({
        moderationStatus: result.approved ? "approved" : result.flags.some((f) => f.severity === "critical" || f.severity === "high") ? "rejected" : "flagged",
        moderationNotes: result.reasoning + (result.flags.length ? "\n\nFlags: " + result.flags.map((f) => `[${f.severity.toUpperCase()}] ${f.type}: ${f.explanation}`).join("; ") : ""),
        status: result.approved ? "approved" : "draft",
      })
      .where(eq(socialPosts.id, postId));

    await complianceModerator.logAction(userId, "moderate_post", {
      postId,
      details: `Moderation result: ${result.approved ? "approved" : "rejected/flagged"} — ${result.reasoning}`,
    });

    return { approved: result.approved, notes: result.reasoning };
  }

  async publishPost(postId: number, userId: number, accounts: SocialMediaAccount[]): Promise<PublishResult[]> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const posts = await db.select().from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
    const post = posts[0];
    if (!post) throw new Error("Post not found");
    if (post.moderationStatus !== "approved") throw new Error("Post must be approved before publishing");

    const results: PublishResult[] = [];

    for (const account of accounts) {
      const result = await this.publishToPlatform(post, account);
      results.push(result);

      await db.insert(socialPostPlatforms).values({
        postId,
        accountId: account.id,
        platform: account.platform,
        externalPostId: result.externalPostId ?? null,
        publishStatus: result.success ? "published" : "failed",
        publishedAt: result.success ? new Date() : null,
        errorMessage: result.error ?? null,
      });
    }

    const allFailed = results.every((r) => !r.success);
    const anyPublished = results.some((r) => r.success);

    await db
      .update(socialPosts)
      .set({
        status: allFailed ? "failed" : anyPublished ? "published" : "failed",
        publishedAt: anyPublished ? new Date() : null,
      })
      .where(eq(socialPosts.id, postId));

    await complianceModerator.logAction(userId, "publish_post", {
      postId,
      details: `Published to ${results.filter((r) => r.success).map((r) => r.platform).join(", ")}`,
    });

    return results;
  }

  private async publishToPlatform(post: SocialPost, account: SocialMediaAccount): Promise<PublishResult> {
    return {
      platform: account.platform,
      success: true,
      externalPostId: `demo_${Date.now()}_${account.platform}`,
    };
  }

  async getMetrics(postId: number): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(socialMetrics)
      .where(eq(socialMetrics.postId, postId))
      .orderBy(desc(socialMetrics.collectedAt));
  }

  async generateROIInsight(eventId: number): Promise<{ correlation: number; insight: string; recommendations: string[] }> {
    const db = await getDb();
    if (!db) return { correlation: 0, insight: "No data available", recommendations: [] };

    const posts = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.eventId, eventId), eq(socialPosts.status, "published")));

    if (posts.length === 0) {
      return { correlation: 0, insight: "No published posts found for this event", recommendations: ["Publish social posts from event content to start tracking ROI"] };
    }

    const metricsAll: any[] = [];
    for (const post of posts) {
      const m = await this.getMetrics(post.id);
      metricsAll.push(...m);
    }

    const totalEngagement = metricsAll.reduce((s, m) => s + m.likes + m.shares + m.comments, 0);
    const avgROI = metricsAll.length ? metricsAll.reduce((s, m) => s + (m.roiCorrelation ?? 0), 0) / metricsAll.length : 0;

    const prompt = `Analyze social media performance for this investor event:
- ${posts.length} posts published
- Total engagement: ${totalEngagement} interactions
- Average ROI correlation: ${(avgROI * 100).toFixed(1)}%

Generate a 2-3 sentence insight about the social media ROI impact and 3 specific recommendations to improve performance.
Return JSON: { "insight": "...", "recommendations": ["...", "...", "..."] }`;

    try {
      const result = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(result.choices?.[0]?.message?.content ?? "{}");
      return {
        correlation: avgROI,
        insight: parsed.insight ?? "Analysis complete",
        recommendations: parsed.recommendations ?? [],
      };
    } catch {
      return {
        correlation: avgROI,
        insight: `${posts.length} posts generated ${totalEngagement} engagements. ROI correlation: ${(avgROI * 100).toFixed(1)}%.`,
        recommendations: ["Add more visual content for higher engagement", "Post within 1 hour of event close", "Use platform-specific hashtags"],
      };
    }
  }
}

export const socialMediaService = new SocialMediaService();
