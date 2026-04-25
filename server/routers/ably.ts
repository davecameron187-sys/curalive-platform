import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getAblyClient } from "../_core/ably";
// SECURITY FLAG: Ably token is not scoped to role or channel.
// Any authenticated user can obtain a token.
// Must be restricted before production.
// Follow-up task: Phase 3 Task 4 — Ably Capability/Channel Scoping.

/**
 * Ably Router — handles real-time messaging and token generation
 */
export const ablyRouter = router({
  /**
   * Generate a token for frontend Ably client authentication
   */
  getToken: protectedProcedure.query(async ({ ctx }) => {
    try {
      const client = await getAblyClient();
      if (!client) {
        throw new Error("Ably client not initialized");
      }

      // Generate a token for this user
      const tokenRequest = await client.auth.createTokenRequest({
        clientId: `user-${ctx.user.id}`,
        ttl: 3600000, // 1 hour
      });

      return tokenRequest;
    } catch (error) {
      console.error("[Ably] Failed to generate token:", error);
      throw new Error("Failed to generate Ably token");
    }
  }),

  /**
   * Subscribe to real-time event updates
   */
  subscribeToEvents: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      // This is a placeholder for subscription setup
      // Actual subscription happens on the frontend via useAblyChannel hook
      return {
        channel: `events:${input.eventId}`,
        status: "ready",
      };
    }),

  /**
   * Subscribe to real-time registration updates
   */
  subscribeToRegistrations: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return {
        channel: `registrations:${input.eventId}`,
        status: "ready",
      };
    }),

  /**
   * Subscribe to real-time OCC notifications
   */
  subscribeToOccNotifications: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return {
        channel: `occ:notifications:${input.conferenceId}`,
        status: "ready",
      };
    }),

  /**
   * Subscribe to real-time Q&A updates
   */
  subscribeToQa: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return {
        channel: `occ:qa:${input.conferenceId}`,
        status: "ready",
      };
    }),

  /**
   * Subscribe to real-time sentiment updates
   */
  subscribeToSentiment: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return {
        channel: `occ:sentiment:${input.conferenceId}`,
        status: "ready",
      };
    }),

  /**
   * Subscribe to real-time participant status updates
   */
  subscribeToParticipants: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return {
        channel: `occ:participants:${input.conferenceId}`,
        status: "ready",
      };
    }),
});
