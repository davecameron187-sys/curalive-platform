/**
 * stripeWebhook.ts — Stripe webhook handler for Chorus.AI billing events.
 *
 * Registered at POST /api/stripe/webhook with express.raw() middleware
 * BEFORE express.json() so signature verification works correctly.
 *
 * Handled events:
 *   - checkout.session.completed  → save stripeCustomerId + stripeSubscriptionId to user
 *   - customer.subscription.deleted → clear stripeSubscriptionId from user
 */
import type { Request, Response } from "express";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe");
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" });
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // No webhook secret configured — parse body directly (dev/testing only)
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // ⚠️ CRITICAL: Return verification response for Stripe test events
  if (event.id?.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = parseInt(session.metadata?.user_id ?? "0", 10);
        if (!userId) break;

        const db = await getDb();
        if (!db) break;

        await db.update(users)
          .set({
            stripeCustomerId: session.customer ?? null,
            stripeSubscriptionId: session.subscription ?? null,
          } as any)
          .where(eq(users.id, userId));

        console.log(`[Stripe Webhook] Saved subscription for user ${userId}: customer=${session.customer}, sub=${session.subscription}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const db = await getDb();
        if (!db) break;

        // Find user by stripeCustomerId and clear their subscription
        await db.update(users)
          .set({ stripeSubscriptionId: null } as any)
          .where(eq((users as any).stripeCustomerId, subscription.customer));

        console.log(`[Stripe Webhook] Cleared subscription for customer ${subscription.customer}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn(`[Stripe Webhook] Payment failed for customer ${invoice.customer}: ${invoice.id}`);
        // TODO: send email notification to customer
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err);
    return res.status(500).json({ error: "Internal server error processing webhook" });
  }

  return res.json({ received: true });
}
