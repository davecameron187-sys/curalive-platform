import { db } from "../db";
import { marketplaceTemplates, templateReviews } from "../../drizzle/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

interface UserProfile {
  userId: number;
  importedTemplates: number[];
  ratedTemplates: Map<number, number>;
  categories: string[];
  avgRating: number;
}

interface Recommendation {
  templateId: number;
  name: string;
  score: number;
  reason: string;
}

/**
 * Get personalized template recommendations for a user
 */
export async function getPersonalizedRecommendations(
  userId: number,
  limit: number = 5
): Promise<Recommendation[]> {
  try {
    const userProfile = await buildUserProfile(userId);
    const allTemplates = await db.select().from(marketplaceTemplates).where(eq(marketplaceTemplates.status, "published"));

    const scoredTemplates = (allTemplates || [])
      .filter((t) => !userProfile.importedTemplates.includes(t.id))
      .map((template) => {
        const score = calculateRecommendationScore(template, userProfile);
        return {
          templateId: template.id,
          name: template.name,
          score,
          reason: generateRecommendationReason(template, userProfile),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredTemplates;
  } catch (error) {
    console.error("[RecommendationEngine] Error getting recommendations:", error);
    return [];
  }
}

/**
 * Get trending templates based on recent downloads and ratings
 */
export async function getTrendingRecommendations(limit: number = 5): Promise<Recommendation[]> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trendingTemplates = await db
      .select({
        id: marketplaceTemplates.id,
        name: marketplaceTemplates.name,
        downloadCount: marketplaceTemplates.downloadCount,
        averageRating: marketplaceTemplates.averageRating,
        reviewCount: marketplaceTemplates.reviewCount,
      })
      .from(marketplaceTemplates)
      .where(and(eq(marketplaceTemplates.status, "published"), gte(marketplaceTemplates.updatedAt, sevenDaysAgo)))
      .orderBy(
        desc(
          sql`(${marketplaceTemplates.downloadCount} * 0.5 + ${marketplaceTemplates.averageRating} * 10 + ${marketplaceTemplates.reviewCount} * 0.3)`
        )
      )
      .limit(limit);

    return (trendingTemplates || []).map((t) => ({
      templateId: t.id,
      name: t.name,
      score: (t.downloadCount * 0.5 + t.averageRating * 10 + t.reviewCount * 0.3) / 100,
      reason: "Trending in the community",
    }));
  } catch (error) {
    console.error("[RecommendationEngine] Error getting trending templates:", error);
    return [];
  }
}

/**
 * Get similar templates based on category
 */
export async function getSimilarTemplates(templateId: number, limit: number = 5): Promise<Recommendation[]> {
  try {
    const baseTemplate = await db
      .select()
      .from(marketplaceTemplates)
      .where(eq(marketplaceTemplates.id, templateId))
      .then((r) => r[0]);

    if (!baseTemplate) return [];

    const similarTemplates = await db
      .select()
      .from(marketplaceTemplates)
      .where(and(eq(marketplaceTemplates.category, baseTemplate.category), sql`${marketplaceTemplates.id} != ${templateId}`))
      .orderBy(desc(marketplaceTemplates.averageRating))
      .limit(limit);

    return (similarTemplates || []).map((t) => ({
      templateId: t.id,
      name: t.name,
      score: t.averageRating,
      reason: `Similar to "${baseTemplate.name}"`,
    }));
  } catch (error) {
    console.error("[RecommendationEngine] Error getting similar templates:", error);
    return [];
  }
}

/**
 * Get collaborative filtering recommendations
 */
export async function getCollaborativeRecommendations(userId: number, limit: number = 5): Promise<Recommendation[]> {
  try {
    const userRatings = await db
      .select({
        templateId: templateReviews.templateId,
        rating: templateReviews.rating,
      })
      .from(templateReviews)
      .where(eq(templateReviews.userId, userId));

    if (!userRatings || userRatings.length === 0) {
      return getTrendingRecommendations(limit);
    }

    const ratedTemplateIds = userRatings.map((r) => r.templateId);

    const similarUserReviews = await db
      .select({
        userId: templateReviews.userId,
        templateId: templateReviews.templateId,
        rating: templateReviews.rating,
      })
      .from(templateReviews)
      .where(
        and(
          sql`${templateReviews.templateId} IN (${sql.join(ratedTemplateIds)})`,
          sql`${templateReviews.userId} != ${userId}`,
          gte(templateReviews.rating, 4)
        )
      );

    const recommendationCounts = new Map<number, { count: number; avgRating: number }>();

    for (const review of similarUserReviews || []) {
      const current = recommendationCounts.get(review.templateId) || { count: 0, avgRating: 0 };
      recommendationCounts.set(review.templateId, {
        count: current.count + 1,
        avgRating: (current.avgRating * current.count + review.rating) / (current.count + 1),
      });
    }

    const topRecommendations = Array.from(recommendationCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit);

    const recommendations: Recommendation[] = [];
    for (const [templateId, stats] of topRecommendations) {
      const template = await db
        .select()
        .from(marketplaceTemplates)
        .where(eq(marketplaceTemplates.id, templateId))
        .then((r) => r[0]);

      if (template && !ratedTemplateIds.includes(templateId)) {
        recommendations.push({
          templateId: template.id,
          name: template.name,
          score: stats.avgRating,
          reason: `Recommended by ${stats.count} similar users`,
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error("[RecommendationEngine] Error getting collaborative recommendations:", error);
    return [];
  }
}

/**
 * Build user profile from their history
 */
async function buildUserProfile(userId: number): Promise<UserProfile> {
  try {
    const importedTemplates = await db
      .select({ templateId: marketplaceTemplates.id })
      .from(marketplaceTemplates)
      .where(sql`${marketplaceTemplates.importedBy} LIKE ${"%" + userId + "%"}`);

    if (!importedTemplates || importedTemplates.length === 0) {
      return {
        userId,
        importedTemplates: [],
        ratedTemplates: new Map(),
        categories: [],
        avgRating: 0,
      };
    }

    const ratings = await db
      .select({
        templateId: templateReviews.templateId,
        rating: templateReviews.rating,
      })
      .from(templateReviews)
      .where(eq(templateReviews.userId, userId));

    const ratedTemplates = new Map((ratings || []).map((r) => [r.templateId, r.rating]));

    const userTemplates = await db
      .select({ category: marketplaceTemplates.category })
      .from(marketplaceTemplates)
      .where(sql`${marketplaceTemplates.id} IN (${sql.join((importedTemplates || []).map((t) => t.templateId))})`);

    const categories =
      userTemplates && userTemplates.length > 0 ? [...new Set(userTemplates.map((t) => t.category))] : [];

    const avgRating =
      ratings && ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

    return {
      userId,
      importedTemplates: (importedTemplates || []).map((t) => t.templateId),
      ratedTemplates,
      categories,
      avgRating,
    };
  } catch (error) {
    console.error("[RecommendationEngine] Error building user profile:", error);
    return {
      userId,
      importedTemplates: [],
      ratedTemplates: new Map(),
      categories: [],
      avgRating: 0,
    };
  }
}

/**
 * Calculate recommendation score using weighted factors
 */
function calculateRecommendationScore(template: any, userProfile: UserProfile): number {
  let score = 0;

  if (userProfile.categories.includes(template.category)) {
    score += 40;
  }

  score += Math.min(template.averageRating * 6, 30);

  const normalizedDownloads = Math.min(template.downloadCount / 1000, 20);
  score += normalizedDownloads;

  const normalizedReviews = Math.min(template.reviewCount / 100, 10);
  score += normalizedReviews;

  return score;
}

/**
 * Generate human-readable recommendation reason
 */
function generateRecommendationReason(template: any, userProfile: UserProfile): string {
  const reasons: string[] = [];

  if (userProfile.categories.includes(template.category)) {
    reasons.push(`Popular in ${template.category}`);
  }

  if (template.averageRating >= 4.5) {
    reasons.push("Highly rated");
  }

  if (template.downloadCount > 1000) {
    reasons.push("Community favorite");
  }

  if (reasons.length === 0) {
    reasons.push("Recommended for you");
  }

  return reasons.join(" • ");
}

/**
 * Track recommendation impression
 */
export async function trackRecommendationImpression(
  userId: number,
  templateId: number,
  type: "personalized" | "trending" | "similar" | "collaborative"
): Promise<void> {
  try {
    console.log(`[RecommendationEngine] Tracked ${type} recommendation of template ${templateId} to user ${userId}`);
  } catch (error) {
    console.error("[RecommendationEngine] Error tracking impression:", error);
  }
}

/**
 * Get recommendation metrics for a template
 */
export async function getRecommendationMetrics(templateId: number): Promise<{
  impressions: number;
  clicks: number;
  imports: number;
  ctr: number;
}> {
  try {
    return {
      impressions: 0,
      clicks: 0,
      imports: 0,
      ctr: 0,
    };
  } catch (error) {
    console.error("[RecommendationEngine] Error getting metrics:", error);
    return {
      impressions: 0,
      clicks: 0,
      imports: 0,
      ctr: 0,
    };
  }
}
