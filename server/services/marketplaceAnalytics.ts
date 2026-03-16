import { db } from "../db";
import { marketplaceTemplates, templateReviews } from "../../drizzle/schema";
import { eq, gte, lte, desc, sql } from "drizzle-orm";

export interface AnalyticsMetrics {
  totalDownloads: number;
  totalReviews: number;
  averageRating: number;
  downloadTrend: { date: string; count: number }[];
  topTemplates: {
    id: number;
    name: string;
    downloads: number;
    rating: number;
  }[];
  categoryDistribution: { category: string; count: number }[];
  engagementMetrics: {
    avgReviewsPerTemplate: number;
    avgRatingPerTemplate: number;
    reviewsPerDay: number;
  };
}

export interface TemplateAnalytics {
  templateId: number;
  name: string;
  downloads: number;
  rating: number;
  reviews: number;
  downloadTrend: { date: string; count: number }[];
  reviewTrend: { date: string; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
  topReviews: {
    userId: number;
    rating: number;
    comment?: string;
    createdAt: Date;
  }[];
}

/**
 * Get overall marketplace analytics
 */
export async function getMarketplaceAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsMetrics> {
  const dateFilter = startDate
    ? gte(marketplaceTemplates.createdAt, startDate)
    : undefined;
  const endDateFilter = endDate
    ? lte(marketplaceTemplates.createdAt, endDate)
    : undefined;

  // Get total downloads
  const downloadStats = await db
    .select({
      totalDownloads: sql<number>`SUM(${marketplaceTemplates.downloadCount})`,
    })
    .from(marketplaceTemplates)
    .where(eq(marketplaceTemplates.published, true));

  const totalDownloads = downloadStats[0]?.totalDownloads || 0;

  // Get total reviews
  const reviewStats = await db
    .select({
      totalReviews: sql<number>`COUNT(*)`,
      avgRating: sql<number>`AVG(${templateReviews.rating})`,
    })
    .from(templateReviews);

  const totalReviews = reviewStats[0]?.totalReviews || 0;
  const averageRating = reviewStats[0]?.avgRating || 0;

  // Get top templates
  const topTemplates = await db
    .select({
      id: marketplaceTemplates.id,
      name: marketplaceTemplates.name,
      downloads: marketplaceTemplates.downloadCount,
      rating: marketplaceTemplates.averageRating,
    })
    .from(marketplaceTemplates)
    .where(eq(marketplaceTemplates.published, true))
    .orderBy(desc(marketplaceTemplates.downloadCount))
    .limit(10);

  // Get category distribution
  const categoryStats = await db
    .select({
      category: marketplaceTemplates.category,
      count: sql<number>`COUNT(*)`,
    })
    .from(marketplaceTemplates)
    .where(eq(marketplaceTemplates.published, true))
    .groupBy(marketplaceTemplates.category);

  // Calculate engagement metrics
  const templates = await db
    .select()
    .from(marketplaceTemplates)
    .where(eq(marketplaceTemplates.published, true));

  const avgReviewsPerTemplate = templates.length > 0 ? totalReviews / templates.length : 0;
  const avgRatingPerTemplate = templates.length > 0 ? averageRating : 0;
  const reviewsPerDay = totalReviews / 30; // Simplified: assume 30 days

  return {
    totalDownloads,
    totalReviews,
    averageRating,
    downloadTrend: [], // Would be populated from historical data
    topTemplates: topTemplates as any,
    categoryDistribution: categoryStats as any,
    engagementMetrics: {
      avgReviewsPerTemplate,
      avgRatingPerTemplate,
      reviewsPerDay,
    },
  };
}

/**
 * Get analytics for a specific template
 */
export async function getTemplateAnalytics(
  templateId: number
): Promise<TemplateAnalytics> {
  const template = await db
    .select()
    .from(marketplaceTemplates)
    .where(eq(marketplaceTemplates.id, templateId));

  if (!template.length) {
    throw new Error("Template not found");
  }

  const t = template[0];

  // Get reviews
  const reviews = await db
    .select()
    .from(templateReviews)
    .where(eq(templateReviews.templateId, templateId))
    .orderBy(desc(templateReviews.createdAt));

  // Calculate rating distribution
  const ratingDistribution: { rating: number; count: number }[] = [];
  for (let i = 1; i <= 5; i++) {
    const count = reviews.filter((r) => r.rating === i).length;
    ratingDistribution.push({ rating: i, count });
  }

  // Get top reviews
  const topReviews = reviews.slice(0, 5).map((r) => ({
    userId: r.userId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  }));

  return {
    templateId,
    name: t.name,
    downloads: t.downloadCount,
    rating: t.averageRating,
    reviews: reviews.length,
    downloadTrend: [], // Would be populated from historical data
    reviewTrend: [], // Would be populated from historical data
    ratingDistribution,
    topReviews,
  };
}

/**
 * Track template download
 */
export async function trackTemplateDownload(templateId: number): Promise<void> {
  await db
    .update(marketplaceTemplates)
    .set({
      downloadCount: sql`${marketplaceTemplates.downloadCount} + 1`,
    })
    .where(eq(marketplaceTemplates.id, templateId));
}

/**
 * Get trending templates (most downloaded in last 7 days)
 */
export async function getTrendingTemplates(
  limit: number = 10
): Promise<typeof marketplaceTemplates.$inferSelect[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const trending = await db
    .select()
    .from(marketplaceTemplates)
    .where(
      gte(marketplaceTemplates.createdAt, sevenDaysAgo) &&
        eq(marketplaceTemplates.published, true)
    )
    .orderBy(desc(marketplaceTemplates.downloadCount))
    .limit(limit);

  return trending;
}

/**
 * Get templates by category with stats
 */
export async function getCategoryStats(): Promise<
  { category: string; count: number; avgRating: number; totalDownloads: number }[]
> {
  const stats = await db
    .select({
      category: marketplaceTemplates.category,
      count: sql<number>`COUNT(*)`,
      avgRating: sql<number>`AVG(${marketplaceTemplates.averageRating})`,
      totalDownloads: sql<number>`SUM(${marketplaceTemplates.downloadCount})`,
    })
    .from(marketplaceTemplates)
    .where(eq(marketplaceTemplates.published, true))
    .groupBy(marketplaceTemplates.category);

  return stats as any;
}

/**
 * Get user engagement metrics
 */
export async function getUserEngagementMetrics(): Promise<{
  totalUsers: number;
  activeReviewers: number;
  avgReviewsPerUser: number;
  topReviewers: { userId: number; reviewCount: number }[];
}> {
  const reviewStats = await db
    .select({
      totalReviewers: sql<number>`COUNT(DISTINCT ${templateReviews.userId})`,
      totalReviews: sql<number>`COUNT(*)`,
    })
    .from(templateReviews);

  const topReviewers = await db
    .select({
      userId: templateReviews.userId,
      reviewCount: sql<number>`COUNT(*)`,
    })
    .from(templateReviews)
    .groupBy(templateReviews.userId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  const totalReviewers = reviewStats[0]?.totalReviewers || 0;
  const totalReviews = reviewStats[0]?.totalReviews || 0;

  return {
    totalUsers: totalReviewers,
    activeReviewers: totalReviewers,
    avgReviewsPerUser: totalReviewers > 0 ? totalReviews / totalReviewers : 0,
    topReviewers: topReviewers as any,
  };
}

/**
 * Get marketplace health score (0-100)
 */
export async function getMarketplaceHealthScore(): Promise<number> {
  const metrics = await getMarketplaceAnalytics();
  const engagement = await getUserEngagementMetrics();

  // Calculate health score based on various factors
  const downloadScore = Math.min(metrics.totalDownloads / 1000, 25); // Max 25 points
  const reviewScore = Math.min(metrics.totalReviews / 100, 25); // Max 25 points
  const ratingScore = (metrics.averageRating / 5) * 25; // Max 25 points
  const engagementScore = Math.min(engagement.activeReviewers / 50, 25); // Max 25 points

  return Math.round(downloadScore + reviewScore + ratingScore + engagementScore);
}
