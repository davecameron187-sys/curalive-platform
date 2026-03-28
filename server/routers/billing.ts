/**
 * Billing Router
 * tRPC procedures for billing platform integration
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as billingService from "../billing.integration";

export const billingRouter = router({
  /**
   * Get current user's subscription
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get user's billing customer ID from database
      // This would be fetched from your users table
      const customerId = String(ctx.user?.id); // Adjust based on your schema

      if (!customerId) {
        return { subscription: null, error: "User not found" };
      }

      const subscription = await billingService.getCustomerSubscription(customerId);

      return {
        subscription,
        error: null,
      };
    } catch (error) {
      return {
        subscription: null,
        error: String(error),
      };
    }
  }),

  /**
   * Get current user's usage for month
   */
  getUsage: protectedProcedure
    .input(
      z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const customerId = String(ctx.user?.id);

        if (!customerId) {
          return { usage: null, error: "User not found" };
        }

        const usage = await billingService.getCustomerUsage(customerId, input.month);

        return {
          usage,
          error: null,
        };
      } catch (error) {
        return {
          usage: null,
          error: String(error),
        };
      }
    }),

  /**
   * Upgrade to premium plan
   */
  upgradePlan: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["pro", "enterprise"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const customerId = String(ctx.user?.id);

        if (!customerId) {
          return { success: false, error: "User not found" };
        }

        const subscription = await billingService.upgradeCustomerPlan(
          customerId,
          input.plan
        );

        if (!subscription) {
          return { success: false, error: "Failed to upgrade plan" };
        }

        // Log action
        console.log(`[Billing] User ${customerId} upgraded to ${input.plan}`);

        return {
          success: true,
          subscription,
          error: null,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const customerId = String(ctx.user?.id);

      if (!customerId) {
        return { success: false, error: "User not found" };
      }

      const success = await billingService.cancelSubscription(customerId);

      if (!success) {
        return { success: false, error: "Failed to cancel subscription" };
      }

      // Log action
      console.log(`[Billing] User ${customerId} canceled subscription`);

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }),

  /**
   * Track usage event
   */
  trackUsage: protectedProcedure
    .input(
      z.object({
        eventsCreated: z.number().optional(),
        attendeesTracked: z.number().optional(),
        questionsProcessed: z.number().optional(),
        transcriptMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const customerId = String(ctx.user?.id);

        if (!customerId) {
          return { success: false, error: "User not found" };
        }

        const success = await billingService.trackUsage(customerId, input);

        return {
          success,
          error: success ? null : "Failed to track usage",
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Get invoice
   */
  getInvoice: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const invoice = await billingService.getInvoice(input.invoiceId);

        if (!invoice) {
          return { invoice: null, error: "Invoice not found" };
        }

        // Verify invoice belongs to current user
        if (invoice.customerId !== String(ctx.user?.id)) {
          return { invoice: null, error: "Unauthorized" };
        }

        return {
          invoice,
          error: null,
        };
      } catch (error) {
        return {
          invoice: null,
          error: String(error),
        };
      }
    }),

  /**
   * Sync billing data
   */
  syncBillingData: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const customerId = String(ctx.user?.id);

      if (!customerId) {
        return { success: false, error: "User not found" };
      }

      const success = await billingService.syncBillingData(customerId);

      return {
        success,
        error: success ? null : "Failed to sync billing data",
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }),

  /**
   * Get billing status (public endpoint for health check)
   */
  getStatus: publicProcedure.query(async () => {
    try {
      const result = await billingService.initializeBillingPlatform();

      return {
        connected: result.success,
        error: result.error || null,
      };
    } catch (error) {
      return {
        connected: false,
        error: String(error),
      };
    }
  }),
});

export default billingRouter;
