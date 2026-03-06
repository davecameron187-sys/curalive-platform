/**
 * billingRouter.ts — CuraLive Stripe billing procedures.
 *
 * Procedures:
 *   - billing.getPlans        — public, returns plan list for the pricing page
 *   - billing.createCheckout  — protected, creates a Stripe Checkout Session
 *   - billing.getSubscription — protected, returns the user's current subscription
 *   - billing.cancelSubscription — protected, cancels at period end
 */
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { PLANS, getPlanById } from "../products";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Lazy-load Stripe so the server starts even without keys configured
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" });
}

export const billingRouter = router({
  /**
   * Returns all subscription plans (public — used on the pricing/billing page).
   */
  getPlans: publicProcedure.query(() => {
    return PLANS.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceZAR: p.priceZAR,
      priceUSD: p.priceUSD,
      interval: p.interval,
      features: p.features,
      maxAttendees: p.maxAttendees,
      maxEventsPerMonth: p.maxEventsPerMonth,
      highlighted: p.highlighted,
      available: !!p.stripePriceId,
    }));
  }),

  /**
   * Creates a Stripe Checkout Session for the selected plan.
   * Returns the checkout URL to redirect the user to.
   */
  createCheckout: protectedProcedure
    .input(z.object({
      planId: z.string(),
      origin: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error("Stripe is not configured. Please add your Stripe API keys in Settings → Payment.");
      }

      const plan = getPlanById(input.planId);
      if (!plan) throw new Error("Invalid plan");
      if (!plan.stripePriceId) {
        throw new Error("This plan is not yet available for purchase. Please contact sales.");
      }

      const db = await getDb();
      let stripeCustomerId: string | undefined;

      if (db) {
        const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        stripeCustomerId = (user as any).stripeCustomerId ?? undefined;
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        customer: stripeCustomerId,
        customer_email: stripeCustomerId ? undefined : ctx.user.email,
        client_reference_id: ctx.user.id.toString(),
        allow_promotion_codes: true,
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          plan_id: plan.id,
        },
        success_url: `${input.origin}/billing?success=1&plan=${plan.id}`,
        cancel_url: `${input.origin}/billing?cancelled=1`,
      });

      return { checkoutUrl: session.url };
    }),

  /**
   * Returns the user's current active subscription (if any).
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const stripe = getStripe();
    if (!stripe) return null;

    const db = await getDb();
    if (!db) return null;

    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const stripeCustomerId = (user as any).stripeCustomerId;
    if (!stripeCustomerId) return null;

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) return null;

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price?.id;
    const plan = PLANS.find(p => p.stripePriceId === priceId);

    return {
      id: sub.id,
      status: sub.status,
      planId: plan?.id ?? null,
      planName: plan?.name ?? "Unknown Plan",
      currentPeriodEnd: sub.current_period_end * 1000, // convert to ms
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  }),

  /**
   * Cancels the user's subscription at the end of the current billing period.
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe not configured");

    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const stripeCustomerId = (user as any).stripeCustomerId;
    if (!stripeCustomerId) throw new Error("No active subscription found");

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) throw new Error("No active subscription found");

    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    return { success: true };
  }),
});
