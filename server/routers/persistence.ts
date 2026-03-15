import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { publishPostEventData, publishToChannel } from "../_core/ably";
import {
  savePostEventData,
  getPostEventData,
  createStripeCustomer,
  getStripeCustomer,
  createStripeSubscription,
  getActiveSubscription,
  createPremiumFeatures,
  getPremiumFeatures,
} from "../db";

/**
 * Persistence Router — handles database persistence for events, registrations, and post-event data
 */
export const persistenceRouter = router({
  // ─────────────────────────────────────────────────────────────────────────────
  // Post-Event Data Procedures
  // ─────────────────────────────────────────────────────────────────────────────

  postEvent: router({
    /**
     * Save post-event data (AI summary, transcript, analytics, compliance report)
     */
    save: protectedProcedure
      .input(
        z.object({
          eventId: z.string(),
          conferenceId: z.number().optional(),
          aiSummary: z.string().optional(),
          keyTopics: z.string().optional(),
          sentimentTrends: z.string().optional(),
          keyQuotes: z.string().optional(),
          fullTranscript: z.string().optional(),
          transcriptFormat: z.enum(["txt", "pdf", "vtt", "srt", "json"]).optional(),
          recordingUrl: z.string().optional(),
          recordingKey: z.string().optional(),
          recordingDurationSeconds: z.number().optional(),
          complianceScore: z.number().optional(),
          flaggedItems: z.string().optional(),
          totalParticipants: z.number().optional(),
          totalDuration: z.number().optional(),
          engagementScore: z.number().optional(),
          analyticsData: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await savePostEventData(input);

          // Publish real-time update via Ably
          await publishPostEventData({
            eventId: input.eventId,
            aiSummary: input.aiSummary,
            complianceScore: input.complianceScore,
            engagementScore: input.engagementScore,
          });

          return { success: true, message: "Post-event data saved successfully" };
        } catch (error) {
          console.error("[PostEvent] Failed to save data:", error);
          throw new Error("Failed to save post-event data");
        }
      }),

    /**
     * Retrieve post-event data for a specific event
     */
    get: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input }) => {
        try {
          const data = await getPostEventData(input.eventId);
          return data;
        } catch (error) {
          console.error("[PostEvent] Failed to retrieve data:", error);
          return null;
        }
      }),
  }),

  // ─────────────────────────────────────────────────────────────────────────────
  // Stripe Integration Procedures
  // ─────────────────────────────────────────────────────────────────────────────

  stripe: router({
    /**
     * Create or get Stripe customer record
     */
    getOrCreateCustomer: protectedProcedure
      .input(
        z.object({
          stripeCustomerId: z.string(),
          email: z.string().email(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          let customer = await getStripeCustomer(ctx.user.id);

          if (!customer) {
            await createStripeCustomer(ctx.user.id, input.stripeCustomerId, input.email);
            customer = await getStripeCustomer(ctx.user.id);
          }

          return customer;
        } catch (error) {
          console.error("[Stripe] Failed to create/get customer:", error);
          throw new Error("Failed to manage Stripe customer");
        }
      }),

    /**
     * Create subscription record
     */
    createSubscription: protectedProcedure
      .input(
        z.object({
          stripeSubscriptionId: z.string(),
          stripePriceId: z.string(),
          status: z.enum(["active", "past_due", "unpaid", "canceled", "incomplete"]),
          tier: z.enum(["basic", "professional", "enterprise"]),
          currentPeriodStart: z.date().optional(),
          currentPeriodEnd: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          await createStripeSubscription(ctx.user.id, input);
          await createPremiumFeatures(ctx.user.id, input.tier);

          return { success: true, message: "Subscription created successfully" };
        } catch (error) {
          console.error("[Stripe] Failed to create subscription:", error);
          throw new Error("Failed to create subscription");
        }
      }),

    /**
     * Get active subscription for user
     */
    getActiveSubscription: protectedProcedure.query(async ({ ctx }) => {
      try {
        const subscription = await getActiveSubscription(ctx.user.id);
        return subscription;
      } catch (error) {
        console.error("[Stripe] Failed to get subscription:", error);
        return null;
      }
    }),

    /**
     * Get premium features for user
     */
    getPremiumFeatures: protectedProcedure.query(async ({ ctx }) => {
      try {
        const features = await getPremiumFeatures(ctx.user.id);
        return features;
      } catch (error) {
        console.error("[Stripe] Failed to get premium features:", error);
        return null;
      }
    }),
  }),
});
