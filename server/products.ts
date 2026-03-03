/**
 * products.ts — Chorus.AI subscription plan definitions.
 *
 * These are the canonical plan objects used across the billing system.
 * Stripe Price IDs are set via environment variables so they can differ
 * between test and production environments without code changes.
 *
 * Plans:
 *   - Starter:      R 4,999/month  — up to 500 attendees, 5 events/month
 *   - Professional: R 9,999/month  — up to 2,000 attendees, 20 events/month
 *   - Enterprise:   R 24,999/month — unlimited attendees, unlimited events
 */

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceZAR: number; // monthly price in ZAR (for display)
  priceUSD: number; // monthly price in USD (Stripe charges in USD)
  interval: "month" | "year";
  features: string[];
  maxAttendees: number | null; // null = unlimited
  maxEventsPerMonth: number | null; // null = unlimited
  highlighted: boolean; // show "Most Popular" badge
  stripePriceId: string | null; // set from env, null when not yet configured
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small teams running occasional events.",
    priceZAR: 4999,
    priceUSD: 269,
    interval: "month",
    features: [
      "Up to 500 attendees per event",
      "5 live events per month",
      "Real-time transcription (Recall.ai)",
      "Smart Q&A moderation",
      "Live polls & chat",
      "Post-event AI summary",
      "Email support",
    ],
    maxAttendees: 500,
    maxEventsPerMonth: 5,
    highlighted: false,
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? null,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For IR teams and corporate communications departments.",
    priceZAR: 9999,
    priceUSD: 539,
    interval: "month",
    features: [
      "Up to 2,000 attendees per event",
      "20 live events per month",
      "Everything in Starter",
      "Sentiment analysis",
      "Auto-translation (8 languages)",
      "Custom branding & white-label",
      "OCC operator console",
      "Priority support",
    ],
    maxAttendees: 2000,
    maxEventsPerMonth: 20,
    highlighted: true,
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL ?? null,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large enterprises and broadcast-grade events.",
    priceZAR: 24999,
    priceUSD: 1349,
    interval: "month",
    features: [
      "Unlimited attendees",
      "Unlimited events",
      "Everything in Professional",
      "PSTN dial-in (Twilio)",
      "Zoom RTMS & Teams Bot integration",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom contract & invoicing",
    ],
    maxAttendees: null,
    maxEventsPerMonth: null,
    highlighted: false,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find(p => p.id === id);
}
