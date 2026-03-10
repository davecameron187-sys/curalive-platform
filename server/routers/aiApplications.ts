/**
 * AI Applications Router
 * tRPC procedures for AI application discovery and recommendations
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import {
  aiApplications,
  getRecommendedApplications,
  getTopRecommendedApplications,
  getApplicationsByCategory,
  getAllCategories,
  getAllSectors,
  getAllEventTypes,
  Sector,
  EventType,
} from '../config/aiApplications';

export const aiApplicationsRouter = router({
  /**
   * Get all AI applications
   */
  getAll: publicProcedure.query(() => {
    return Object.values(aiApplications);
  }),

  /**
   * Get AI applications by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return aiApplications[input.id] || null;
    }),

  /**
   * Get recommended AI applications for a sector and event type
   */
  getRecommended: publicProcedure
    .input(
      z.object({
        sector: z.enum(['financial-services', 'healthcare', 'technology', 'government', 'corporate', 'media-entertainment', 'education', 'non-profit'] as const),
        eventType: z.enum(['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'] as const),
      })
    )
    .query(({ input }) => {
      return getRecommendedApplications(input.sector as Sector, input.eventType as EventType);
    }),

  /**
   * Get top N recommended AI applications
   */
  getTopRecommended: publicProcedure
    .input(
      z.object({
        sector: z.enum(['financial-services', 'healthcare', 'technology', 'government', 'corporate', 'media-entertainment', 'education', 'non-profit'] as const),
        eventType: z.enum(['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'] as const),
        limit: z.number().int().min(1).max(28).default(5),
      })
    )
    .query(({ input }) => {
      return getTopRecommendedApplications(input.sector as Sector, input.eventType as EventType, input.limit);
    }),

  /**
   * Get AI applications by category
   */
  getByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => {
      return getApplicationsByCategory(input.category);
    }),

  /**
   * Get all categories
   */
  getAllCategories: publicProcedure.query(() => {
    return getAllCategories();
  }),

  /**
   * Get all sectors
   */
  getAllSectors: publicProcedure.query(() => {
    return getAllSectors();
  }),

  /**
   * Get all event types
   */
  getAllEventTypes: publicProcedure.query(() => {
    return getAllEventTypes();
  }),

  /**
   * Get applications by multiple IDs
   */
  getByIds: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(({ input }) => {
      return input.ids
        .map(id => aiApplications[id])
        .filter(app => app !== undefined);
    }),

  /**
   * Search applications by name or description
   */
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }) => {
      const query = input.query.toLowerCase();
      return Object.values(aiApplications).filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.category.toLowerCase().includes(query) ||
        app.benefits.some(b => b.toLowerCase().includes(query))
      );
    }),

  /**
   * Get applications by sector
   */
  getBySector: publicProcedure
    .input(z.object({ sector: z.string() }))
    .query(({ input }) => {
      return Object.values(aiApplications).filter(app =>
        app.sectors.includes(input.sector as Sector)
      );
    }),

  /**
   * Get applications by event type
   */
  getByEventType: publicProcedure
    .input(z.object({ eventType: z.string() }))
    .query(({ input }) => {
      return Object.values(aiApplications).filter(app =>
        app.eventTypes.includes(input.eventType as EventType)
      );
    }),

  /**
   * Get high-priority applications for a sector and event type
   */
  getHighPriority: publicProcedure
    .input(
      z.object({
        sector: z.enum(['financial-services', 'healthcare', 'technology', 'government', 'corporate', 'media-entertainment', 'education', 'non-profit'] as const),
        eventType: z.enum(['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'] as const),
      })
    )
    .query(({ input }) => {
      return getRecommendedApplications(input.sector as Sector, input.eventType as EventType)
        .filter(app => app.priority === 'high');
    }),

  /**
   * Get applications with estimated ROI
   */
  getWithROI: publicProcedure
    .input(
      z.object({
        sector: z.enum(['financial-services', 'healthcare', 'technology', 'government', 'corporate', 'media-entertainment', 'education', 'non-profit'] as const),
        eventType: z.enum(['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'] as const),
      })
    )
    .query(({ input }) => {
      return getRecommendedApplications(input.sector as Sector, input.eventType as EventType)
        .map(app => ({
          ...app,
          roiScore: calculateROIScore(app),
        }))
        .sort((a, b) => b.roiScore - a.roiScore);
    }),
});

/**
 * Calculate ROI score based on benefits and stats
 */
function calculateROIScore(app: any): number {
  let score = 0;

  // Priority scoring
  const priorityScores = { high: 100, medium: 50, low: 25 };
  score += priorityScores[app.priority] || 0;

  // Benefits scoring
  score += app.benefits.length * 10;

  // Stats scoring
  score += app.stats.length * 5;

  // Time to value scoring
  const timeScores = {
    'Immediate (during event)': 50,
    'Immediate post-event': 40,
    'Post-event': 30,
    'During event': 50,
    'Pre-event': 20,
    'Continuous': 60,
    'Post-meeting': 30,
  };
  score += timeScores[app.timeToValue as keyof typeof timeScores] || 0;

  return score;
}
