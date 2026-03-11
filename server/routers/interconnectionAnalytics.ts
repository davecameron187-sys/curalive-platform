// @ts-nocheck
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { interconnectionActivations, interconnectionAnalytics } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

const FEATURE_LABELS: Record<string, string> = {
  transcription: "Live Transcription",
  sentiment: "Sentiment Analysis",
  "qa-triage": "Q&A Auto-Triage",
  toxicity: "Toxicity Filter",
  compliance: "Compliance Check",
  "pace-coach": "Pace Coach",
  "rolling-summary": "Rolling Summary",
  "event-brief": "Event Brief",
  "press-release": "Press Release",
  "follow-ups": "Investor Follow-Ups",
  "social-echo": "Event Echo",
  broadcaster: "Intelligent Broadcaster",
  podcast: "Podcast Converter",
  sustainability: "Sustainability",
  recap: "AI Video Recap",
  "lead-scoring": "Lead Scoring",
};

const MOCK_TOP_INTERCONNECTIONS = [
  { pair: "transcription → sentiment", count: 847, roi: 2.1 },
  { pair: "sentiment → compliance", count: 634, roi: 2.9 },
  { pair: "compliance → follow-ups", count: 521, roi: 2.6 },
  { pair: "transcription → qa-triage", count: 489, roi: 1.8 },
  { pair: "qa-triage → toxicity", count: 412, roi: 2.4 },
  { pair: "rolling-summary → press-release", count: 378, roi: 2.2 },
  { pair: "sentiment → broadcaster", count: 356, roi: 3.1 },
  { pair: "follow-ups → lead-scoring", count: 299, roi: 2.8 },
  { pair: "social-echo → podcast", count: 241, roi: 2.0 },
  { pair: "broadcaster → sustainability", count: 198, roi: 1.8 },
];

export const interconnectionAnalyticsRouter = router({
  getAdoptionMetrics: publicProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const trend = Array.from({ length: input.days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (input.days - 1 - i));
        const base = 40 + Math.floor(i * 2.1);
        return {
          date: d.toISOString().slice(0, 10),
          activations: base + Math.floor(Math.random() * 20),
          uniqueUsers: Math.floor(base * 0.6),
        };
      });
      return {
        totalActivations: 6842,
        dailyAverage: 228,
        trend,
        clickThroughRate: 0.34,
        interconnectionVsManual: { interconnection: 0.67, manual: 0.33 },
      };
    }),

  getTopInterconnections: publicProcedure.query(async () => {
    return { topPairs: MOCK_TOP_INTERCONNECTIONS };
  }),

  getROIMetrics: publicProcedure.query(async () => {
    return {
      projectedROI: 3.8,
      realizedROI: 2.9,
      realizationRate: 0.76,
      avgROIPerInterconnection: 2.3,
      byType: [
        { type: "Compliance Chain", projected: 4.2, realized: 3.5 },
        { type: "Content Pipeline", projected: 3.6, realized: 2.8 },
        { type: "IR Workflow", projected: 3.9, realized: 3.1 },
        { type: "Social Amplification", projected: 3.2, realized: 2.4 },
      ],
    };
  }),

  getWorkflowMetrics: publicProcedure.query(async () => {
    return {
      completionRate: 0.62,
      avgStepsCompleted: 2.8,
      dropoffPoints: [
        { step: "Activate Core Feature", dropoff: 0.05 },
        { step: "Unlock First Connection", dropoff: 0.18 },
        { step: "Activate Second Connection", dropoff: 0.31 },
        { step: "Full Network Active", dropoff: 0.38 },
      ],
      topWorkflows: [
        { name: "IR Bundle Core Loop", completion: 0.74 },
        { name: "Compliance Chain", completion: 0.68 },
        { name: "Content Pipeline", completion: 0.61 },
        { name: "Social Amplification", completion: 0.52 },
      ],
    };
  }),

  getSegmentMetrics: publicProcedure.query(async () => {
    return {
      segments: [
        { name: "Enterprise", count: 42, avgConnections: 8.4, roiRealized: 3.4, timeToValue: 6 },
        { name: "Mid-Market", count: 118, avgConnections: 5.1, roiRealized: 2.7, timeToValue: 12 },
        { name: "SMB", count: 203, avgConnections: 2.9, roiRealized: 1.9, timeToValue: 21 },
      ],
      byIndustry: [
        { industry: "Finance", adoption: 0.81 },
        { industry: "Healthcare", adoption: 0.64 },
        { industry: "Technology", adoption: 0.72 },
        { industry: "Real Estate", adoption: 0.48 },
      ],
    };
  }),

  recordActivation: publicProcedure
    .input(z.object({
      eventId: z.string().optional(),
      featureId: z.string(),
      connectedFeatureId: z.string(),
      activationSource: z.string().default("see_connections"),
      roiMultiplier: z.number().default(2.0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      await db.insert(interconnectionActivations).values({
        eventId: input.eventId,
        userId: ctx.user?.id ?? 0,
        featureId: input.featureId,
        connectedFeatureId: input.connectedFeatureId,
        activationSource: input.activationSource,
        roiMultiplier: input.roiMultiplier,
      });
      return { success: true };
    }),
});

export type InterconnectionAnalyticsRouter = typeof interconnectionAnalyticsRouter;
