// @ts-nocheck
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { agenticAnalyses } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

// ─── Bundle definitions ───────────────────────────────────────────────────────

const BUNDLES: Record<string, { letter: string; name: string; roi: string; features: string[]; color: string }> = {
  ir: {
    letter: "A",
    name: "Investor Relations",
    roi: "+35% engagement, 2.8× lead scoring ROI",
    features: ["Event Brief", "Real-Time Sentiment Dashboard", "Automated Investor Follow-Up", "Lead Scoring", "Q&A Auto-Triage", "Live Transcription"],
    color: "emerald",
  },
  compliance: {
    letter: "B",
    name: "Compliance & Risk",
    roi: "100% audit coverage, zero regulatory incidents",
    features: ["Material Statement Flagging", "Compliance Risk Assessment", "Toxicity Filter", "Live Transcription", "Sentiment Analysis"],
    color: "amber",
  },
  operations: {
    letter: "C",
    name: "Operations & Efficiency",
    roi: "80% manual workload reduction, 60% faster Q&A",
    features: ["Live Transcription", "Q&A Auto-Triage", "Pace Coach", "Rolling Summary", "Intelligent Broadcaster"],
    color: "blue",
  },
  marketing: {
    letter: "D",
    name: "Content & Marketing",
    roi: "90% faster content creation, 10× more distribution",
    features: ["Event Summary Generation", "Press Release Generator", "Event Echo (Social)", "Podcast Converter", "AI Video Recap"],
    color: "pink",
  },
  executive: {
    letter: "E",
    name: "Premium All-Access",
    roi: "Maximum ROI across all dimensions",
    features: ["All 28 features from Bundles A–D", "Intelligent Broadcaster", "Advanced Analytics", "ESG Certification"],
    color: "violet",
  },
};

// ─── Role → Bundle mapping ────────────────────────────────────────────────────

const ROLE_BUNDLE_MAP: Record<string, string> = {
  ir: "ir",
  compliance: "compliance",
  operations: "operations",
  marketing: "marketing",
  executive: "executive",
  other: "ir",
};

// ─── Scoring weights ──────────────────────────────────────────────────────────

const CHALLENGE_WEIGHTS: Record<string, number> = {
  engagement: 1.0,
  compliance: 1.0,
  efficiency: 0.9,
  content: 0.9,
  experience: 0.75,
  multiple: 0.85,
};

const EVENT_FACTORS: Record<string, number> = {
  earnings: 1.0,
  investor_day: 0.95,
  roadshow: 0.9,
  board: 0.85,
  product: 0.75,
  webinar: 0.7,
  other: 0.6,
};

// Challenge → bundle alignment bonus (boosts score when challenge matches bundle)
const ALIGNMENT_BONUS: Record<string, Record<string, number>> = {
  engagement: { ir: 0.15, executive: 0.1 },
  compliance: { compliance: 0.2, ir: 0.05 },
  efficiency: { operations: 0.15, compliance: 0.05 },
  content: { marketing: 0.2, ir: 0.05 },
  experience: { operations: 0.1, marketing: 0.1 },
  multiple: { executive: 0.15 },
};

// ─── Interconnections ─────────────────────────────────────────────────────────

const INTERCONNECTIONS: Record<string, { bundle: string; trigger: string; action: string }[]> = {
  ir: [
    { bundle: "Compliance & Risk", trigger: "Material statement flagged by sentiment agent", action: "Compliance agent auto-redacts and logs for FINRA audit" },
    { bundle: "Content & Marketing", trigger: "Earnings call ends", action: "Press release draft generated within 2 minutes" },
    { bundle: "Operations", trigger: "Q&A queue > 10 questions", action: "Auto-triage routes by investor tier" },
  ],
  compliance: [
    { bundle: "Investor Relations", trigger: "Risk score exceeds threshold", action: "IR agent flags investor and pauses follow-up automation" },
    { bundle: "Operations", trigger: "Compliance event detected", action: "Transcription agent creates time-stamped evidence log" },
  ],
  operations: [
    { bundle: "Investor Relations", trigger: "Engagement drops below 70%", action: "IR agent activates poll from Operations bundle" },
    { bundle: "Content & Marketing", trigger: "Event summary generated", action: "Content agent distributes across all channels simultaneously" },
  ],
  marketing: [
    { bundle: "Investor Relations", trigger: "Key investor sentiment spike", action: "Social agent generates real-time LinkedIn highlight" },
    { bundle: "Operations", trigger: "Event summary ready", action: "Podcast conversion auto-queued for distribution" },
  ],
  executive: [
    { bundle: "All Bundles", trigger: "Any agent scores above 0.85", action: "Executive dashboard receives unified ROI briefing" },
    { bundle: "Compliance & Risk", trigger: "Cross-bundle risk detected", action: "Board-level alert with full audit trail" },
  ],
};

// ─── Core scoring algorithm ───────────────────────────────────────────────────

function computeScore(q1Role: string, q2Challenge: string, q3EventType: string): number {
  const bundleKey = ROLE_BUNDLE_MAP[q1Role] ?? "ir";
  const roleMatch = 0.85 + (q1Role !== "other" ? 0.1 : 0);
  const challengeWeight = CHALLENGE_WEIGHTS[q2Challenge] ?? 0.7;
  const eventFactor = EVENT_FACTORS[q3EventType] ?? 0.6;
  const alignmentBonus = (ALIGNMENT_BONUS[q2Challenge]?.[bundleKey] ?? 0);
  const dataPattern = 0.72;

  const raw = (roleMatch * 0.3) + (challengeWeight * 0.4) + (eventFactor * 0.3) + (dataPattern * 0.2) + alignmentBonus;
  return Math.min(0.99, Math.max(0.5, parseFloat(raw.toFixed(3))));
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const agenticEventBrainRouter = router({
  runAnalysis: publicProcedure
    .input(z.object({
      q1Role: z.string(),
      q2Challenge: z.string(),
      q3EventType: z.string(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { q1Role, q2Challenge, q3EventType, sessionId } = input;

      const bundleKey = ROLE_BUNDLE_MAP[q1Role] ?? "ir";
      const bundle = BUNDLES[bundleKey];
      const score = computeScore(q1Role, q2Challenge, q3EventType);
      const interconnections = INTERCONNECTIONS[bundleKey] ?? [];

      const roleLabel = q1Role.charAt(0).toUpperCase() + q1Role.slice(1).replace("_", " ");
      const challengeLabel = q2Challenge.replace("_", " ");
      const eventLabel = q3EventType.replace("_", " ");

      let aiAction = "";
      try {
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are the CuraLive Agentic Event Brain — an autonomous AI system that recommends specific, measurable actions for enterprise event intelligence. Be concise, actionable, and ROI-focused. Respond in 3–4 sentences maximum.`,
            },
            {
              role: "user",
              content: `Optimize Bundle ${bundle.letter}: ${bundle.name} for a ${roleLabel} professional whose biggest challenge is ${challengeLabel}, running ${eventLabel} events. Confidence score: ${(score * 100).toFixed(0)}%. Features available: ${bundle.features.join(", ")}. Provide one specific agentic action recommendation with expected ROI outcome.`,
            },
          ],
        });
        const raw = result.choices?.[0]?.message?.content;
        aiAction = typeof raw === "string" ? raw : JSON.stringify(raw ?? "");
      } catch {
        aiAction = `Activate ${bundle.features[0]} and ${bundle.features[1]} immediately — these two features together deliver ${bundle.roi} with no additional configuration required.`;
      }

      const roiPreview = bundle.roi;
      const interconnectionsJson = JSON.stringify(interconnections);

      try {
        const db = await getDb();
        await db!.insert(agenticAnalyses).values({
          sessionId: sessionId ?? null,
          q1Role,
          q2Challenge,
          q3EventType,
          primaryBundle: bundle.name,
          bundleLetter: bundle.letter,
          score,
          aiAction,
          roiPreview,
          interconnections: interconnectionsJson,
        });
      } catch {
      }

      return {
        bundle: {
          letter: bundle.letter,
          name: bundle.name,
          roi: bundle.roi,
          features: bundle.features,
          color: bundle.color,
        },
        score,
        aiAction,
        roiPreview,
        interconnections,
      };
    }),

  getHistory: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      const rows = await db!
        .select()
        .from(agenticAnalyses)
        .orderBy(desc(agenticAnalyses.createdAt))
        .limit(10);
      return rows;
    } catch {
      return [];
    }
  }),
});
