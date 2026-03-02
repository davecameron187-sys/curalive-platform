import { z } from "zod";
import { router, operatorProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  commitmentSignals,
  investorBriefingPacks,
  liveRoadshows,
  liveRoadshowMeetings,
  liveRoadshowInvestors,
  liveMeetingSummaries,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Ably publish helper ──────────────────────────────────────────────────────
async function ablyPublish(channel: string, event: string, data: unknown) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return;
  try {
    const url = `https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: event, data }),
    });
  } catch (_) {}
}

export const roadshowAIRouter = router({

  // ── Analyse transcript snippet for commitment signals ─────────────────────
  analyseTranscript: operatorProcedure
    .input(z.object({
      meetingDbId: z.number(),
      roadshowId: z.string(),
      transcriptSnippet: z.string().min(10),
      investorId: z.number().optional(),
      investorName: z.string().optional(),
      institution: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert capital markets analyst specialising in investor roadshow intelligence. 
Analyse the provided transcript snippet from a 1:1 investor meeting and detect any commitment signals, interest indicators, objections, or pricing/size discussions.
Return JSON only. Be precise — only flag genuine signals, not generic conversation.`,
          },
          {
            role: "user",
            content: `Analyse this transcript snippet from a roadshow meeting with ${input.investorName ?? "an investor"} at ${input.institution ?? "their institution"}:

"${input.transcriptSnippet}"

Return JSON with:
- signals: array of detected signals, each with:
  - quote: the exact phrase that triggered the signal (max 150 chars)
  - signalType: one of "soft_commit", "interest", "objection", "question", "pricing_discussion", "size_discussion"
  - confidenceScore: 0-100
  - indicatedAmount: any mentioned amount/size (e.g. "$5m", "10% of deal") or null
  - reasoning: brief explanation (max 80 chars)
- overallSentiment: "positive", "neutral", or "negative"
- summary: one sentence summary of investor stance`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "transcript_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                signals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      quote: { type: "string" },
                      signalType: { type: "string", enum: ["soft_commit", "interest", "objection", "question", "pricing_discussion", "size_discussion"] },
                      confidenceScore: { type: "integer" },
                      indicatedAmount: { type: ["string", "null"] },
                      reasoning: { type: "string" },
                    },
                    required: ["quote", "signalType", "confidenceScore", "indicatedAmount", "reasoning"],
                    additionalProperties: false,
                  },
                },
                overallSentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                summary: { type: "string" },
              },
              required: ["signals", "overallSentiment", "summary"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = llmResponse?.choices?.[0]?.message?.content;
      if (!content) throw new Error("LLM returned no content");
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

      // Persist each signal
      const inserted: typeof commitmentSignals.$inferSelect[] = [];
      for (const sig of parsed.signals) {
        const [row] = await db.insert(commitmentSignals).values({
          meetingDbId: input.meetingDbId,
          roadshowId: input.roadshowId,
          investorId: input.investorId ?? null,
          investorName: input.investorName ?? null,
          institution: input.institution ?? null,
          quote: sig.quote,
          signalType: sig.signalType,
          confidenceScore: sig.confidenceScore,
          indicatedAmount: sig.indicatedAmount ?? null,
        }).$returningId();
        // Broadcast to operator channel
        await ablyPublish(
          `roadshow-${input.roadshowId}-signals`,
          "new-signal",
          { id: (row as any).id, ...sig, investorName: input.investorName, institution: input.institution }
        );
      }

      return {
        signals: parsed.signals,
        overallSentiment: parsed.overallSentiment,
        summary: parsed.summary,
        savedCount: parsed.signals.length,
      };
    }),

  // ── Get all signals for a meeting ─────────────────────────────────────────
  getMeetingSignals: protectedProcedure
    .input(z.object({ meetingDbId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(commitmentSignals)
        .where(eq(commitmentSignals.meetingDbId, input.meetingDbId));
    }),

  // ── Get all signals for a roadshow (order book view) ─────────────────────
  getRoadshowSignals: protectedProcedure
    .input(z.object({ roadshowId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(commitmentSignals)
        .where(eq(commitmentSignals.roadshowId, input.roadshowId));
    }),

  // ── Delete a signal ───────────────────────────────────────────────────────
  deleteSignal: operatorProcedure
    .input(z.object({ signalId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(commitmentSignals).where(eq(commitmentSignals.id, input.signalId));
      return { success: true };
    }),

  // ── Generate AI briefing pack for an investor ─────────────────────────────
  generateBriefingPack: operatorProcedure
    .input(z.object({
      investorId: z.number(),
      meetingDbId: z.number(),
      roadshowId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [investor] = await db
        .select()
        .from(liveRoadshowInvestors)
        .where(eq(liveRoadshowInvestors.id, input.investorId));
      if (!investor) throw new Error("Investor not found");

      const [meeting] = await db
        .select()
        .from(liveRoadshowMeetings)
        .where(eq(liveRoadshowMeetings.id, input.meetingDbId));

      const [roadshow] = await db
        .select()
        .from(liveRoadshows)
        .where(eq(liveRoadshows.roadshowId, input.roadshowId));

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior capital markets advisor preparing a pre-meeting briefing pack for a company roadshow presenter. 
Generate a concise, professional briefing note based on the investor's known profile. 
Return JSON only. Be specific and actionable — this will be read by a CEO/CFO 15 minutes before the meeting.`,
          },
          {
            role: "user",
            content: `Generate a pre-meeting briefing pack for this investor meeting:

Investor: ${investor.name}
Institution: ${investor.institution}
Job Title: ${investor.jobTitle ?? "Not specified"}
Meeting: ${roadshow?.title ?? "Roadshow"} — ${roadshow?.issuer ?? ""}
Deal Type: ${roadshow?.serviceType ?? "Capital Raise"}
Meeting Date: ${meeting?.meetingDate ?? ""} ${meeting?.startTime ?? ""}
Platform: ${meeting?.platform ?? "Zoom"}

Return JSON with:
- investorProfile: 2-3 sentences on the institution's mandate, AUM tier, and typical investment style
- recentActivity: 2-3 sentences on likely recent portfolio activity and market positioning relevant to this deal
- suggestedTalkingPoints: array of 4-5 specific talking points tailored to this investor type
- knownConcerns: array of 3-4 likely objections or questions this investor type typically raises
- openingRecommendation: one sentence on how to open the meeting effectively with this investor type`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "briefing_pack",
            strict: true,
            schema: {
              type: "object",
              properties: {
                investorProfile: { type: "string" },
                recentActivity: { type: "string" },
                suggestedTalkingPoints: { type: "array", items: { type: "string" } },
                knownConcerns: { type: "array", items: { type: "string" } },
                openingRecommendation: { type: "string" },
              },
              required: ["investorProfile", "recentActivity", "suggestedTalkingPoints", "knownConcerns", "openingRecommendation"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = llmResponse?.choices?.[0]?.message?.content;
      if (!content) throw new Error("LLM returned no content");
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

      // Upsert briefing pack
      const existing = await db
        .select()
        .from(investorBriefingPacks)
        .where(and(
          eq(investorBriefingPacks.investorId, input.investorId),
          eq(investorBriefingPacks.meetingDbId, input.meetingDbId)
        ));

      if (existing.length > 0) {
        await db.update(investorBriefingPacks)
          .set({
            investorProfile: parsed.investorProfile,
            recentActivity: parsed.recentActivity,
            suggestedTalkingPoints: JSON.stringify(parsed.suggestedTalkingPoints),
            knownConcerns: JSON.stringify(parsed.knownConcerns),
            previousInteractions: parsed.openingRecommendation,
            generatedAt: new Date(),
          })
          .where(and(
            eq(investorBriefingPacks.investorId, input.investorId),
            eq(investorBriefingPacks.meetingDbId, input.meetingDbId)
          ));
      } else {
        await db.insert(investorBriefingPacks).values({
          investorId: input.investorId,
          meetingDbId: input.meetingDbId,
          roadshowId: input.roadshowId,
          investorProfile: parsed.investorProfile,
          recentActivity: parsed.recentActivity,
          suggestedTalkingPoints: JSON.stringify(parsed.suggestedTalkingPoints),
          knownConcerns: JSON.stringify(parsed.knownConcerns),
          previousInteractions: parsed.openingRecommendation,
        });
      }

      return {
        ...parsed,
        investorName: investor.name,
        institution: investor.institution,
      };
    }),

  // ── Get briefing pack for an investor+meeting ─────────────────────────────
  getBriefingPack: protectedProcedure
    .input(z.object({ investorId: z.number(), meetingDbId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [pack] = await db
        .select()
        .from(investorBriefingPacks)
        .where(and(
          eq(investorBriefingPacks.investorId, input.investorId),
          eq(investorBriefingPacks.meetingDbId, input.meetingDbId)
        ));
      if (!pack) return null;
      return {
        ...pack,
        suggestedTalkingPoints: pack.suggestedTalkingPoints ? JSON.parse(pack.suggestedTalkingPoints) : [],
        knownConcerns: pack.knownConcerns ? JSON.parse(pack.knownConcerns) : [],
      };
    }),

  // ── Generate full roadshow debrief report ─────────────────────────────────
  generateDebriefReport: operatorProcedure
    .input(z.object({ roadshowId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [roadshow] = await db
        .select()
        .from(liveRoadshows)
        .where(eq(liveRoadshows.roadshowId, input.roadshowId));
      if (!roadshow) throw new Error("Roadshow not found");

      const meetings = await db
        .select()
        .from(liveRoadshowMeetings)
        .where(eq(liveRoadshowMeetings.roadshowId, input.roadshowId));

      const investors = await db
        .select()
        .from(liveRoadshowInvestors)
        .where(eq(liveRoadshowInvestors.roadshowId, input.roadshowId));

      const signals = await db
        .select()
        .from(commitmentSignals)
        .where(eq(commitmentSignals.roadshowId, input.roadshowId));

      const summaries = await db
        .select()
        .from(liveMeetingSummaries)
        .where(eq(liveMeetingSummaries.roadshowId, input.roadshowId));

      // Build context
      const softCommits = signals.filter(s => s.signalType === "soft_commit");
      const interests = signals.filter(s => s.signalType === "interest");
      const objections = signals.filter(s => s.signalType === "objection");
      const pricingDiscussions = signals.filter(s => s.signalType === "pricing_discussion");
      const sizeDiscussions = signals.filter(s => s.signalType === "size_discussion");

      const completedMeetings = meetings.filter(m => m.status === "completed");
      const noShows = investors.filter(i => i.waitingRoomStatus === "no_show");

      const context = `
ROADSHOW: ${roadshow.title}
ISSUER: ${roadshow.issuer ?? ""}
DEAL TYPE: ${roadshow.serviceType}
DATES: ${roadshow.startDate ?? ""} to ${roadshow.endDate ?? ""}
BANK: ${roadshow.bank ?? ""}

MEETING STATISTICS:
- Total slots: ${meetings.length}
- Completed: ${completedMeetings.length}
- No-shows: ${noShows.length}
- Total investors: ${investors.length}

COMMITMENT SIGNALS DETECTED:
- Soft commits: ${softCommits.length} (${softCommits.map(s => `"${s.quote.slice(0, 60)}..." [${s.institution ?? ""}]`).join("; ")})
- Interest signals: ${interests.length}
- Objections: ${objections.length} (${objections.map(s => `"${s.quote.slice(0, 60)}..."`).join("; ")})
- Pricing discussions: ${pricingDiscussions.length}
- Size discussions: ${sizeDiscussions.length}

INDICATED AMOUNTS: ${signals.filter(s => s.indicatedAmount).map(s => `${s.institution ?? s.investorName}: ${s.indicatedAmount}`).join(", ") || "None recorded"}

MEETING SUMMARIES: ${summaries.map(s => s.summary.slice(0, 200)).join(" | ")}
`.trim();

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior capital markets advisor writing a post-roadshow debrief report for the board and deal team. 
Write in a professional, concise style suitable for senior executives. Return JSON only.`,
          },
          {
            role: "user",
            content: `Generate a comprehensive post-roadshow debrief report based on this data:

${context}

Return JSON with:
- executiveSummary: 2-3 paragraphs summarising the roadshow outcome and investor reception
- demandAssessment: assessment of demand quality and quantity based on signals detected
- topInvestors: array of up to 5 objects with { institution, signalStrength ("strong"/"moderate"/"weak"), notes }
- keyThemes: array of 4-6 recurring themes from investor meetings (topics, concerns, questions)
- objectionAnalysis: 2-3 sentences on the main objections raised and how to address them
- allocationRecommendation: 2-3 sentences on recommended allocation strategy based on demand signals
- nextSteps: array of 4-5 specific recommended next steps for the deal team
- overallOutlook: "strong" | "moderate" | "cautious"`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "debrief_report",
            strict: true,
            schema: {
              type: "object",
              properties: {
                executiveSummary: { type: "string" },
                demandAssessment: { type: "string" },
                topInvestors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      institution: { type: "string" },
                      signalStrength: { type: "string", enum: ["strong", "moderate", "weak"] },
                      notes: { type: "string" },
                    },
                    required: ["institution", "signalStrength", "notes"],
                    additionalProperties: false,
                  },
                },
                keyThemes: { type: "array", items: { type: "string" } },
                objectionAnalysis: { type: "string" },
                allocationRecommendation: { type: "string" },
                nextSteps: { type: "array", items: { type: "string" } },
                overallOutlook: { type: "string", enum: ["strong", "moderate", "cautious"] },
              },
              required: ["executiveSummary", "demandAssessment", "topInvestors", "keyThemes", "objectionAnalysis", "allocationRecommendation", "nextSteps", "overallOutlook"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = llmResponse?.choices?.[0]?.message?.content;
      if (!content) throw new Error("LLM returned no content");
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

      return {
        ...parsed,
        roadshowTitle: roadshow.title,
        issuer: roadshow.issuer,
        totalMeetings: meetings.length,
        completedMeetings: completedMeetings.length,
        totalSignals: signals.length,
        softCommitCount: softCommits.length,
        generatedAt: new Date().toISOString(),
      };
    }),

  // ── Get order book summary for a roadshow ────────────────────────────────
  getOrderBook: protectedProcedure
    .input(z.object({ roadshowId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const signals = await db
        .select()
        .from(commitmentSignals)
        .where(eq(commitmentSignals.roadshowId, input.roadshowId));

      const investors = await db
        .select()
        .from(liveRoadshowInvestors)
        .where(eq(liveRoadshowInvestors.roadshowId, input.roadshowId));

      const meetings = await db
        .select()
        .from(liveRoadshowMeetings)
        .where(eq(liveRoadshowMeetings.roadshowId, input.roadshowId));

      // Group signals by institution
      const byInstitution: Record<string, {
        institution: string;
        investorName: string | null;
        signals: typeof signals;
        highestConfidence: number;
        indicatedAmounts: string[];
        hasSoftCommit: boolean;
      }> = {};

      for (const sig of signals) {
        const key = sig.institution ?? sig.investorName ?? "Unknown";
        if (!byInstitution[key]) {
          byInstitution[key] = {
            institution: sig.institution ?? "Unknown",
            investorName: sig.investorName,
            signals: [],
            highestConfidence: 0,
            indicatedAmounts: [],
            hasSoftCommit: false,
          };
        }
        byInstitution[key].signals.push(sig);
        if (sig.confidenceScore > byInstitution[key].highestConfidence) {
          byInstitution[key].highestConfidence = sig.confidenceScore;
        }
        if (sig.indicatedAmount) byInstitution[key].indicatedAmounts.push(sig.indicatedAmount);
        if (sig.signalType === "soft_commit") byInstitution[key].hasSoftCommit = true;
      }

      const orderBook = Object.values(byInstitution).sort((a, b) => {
        if (a.hasSoftCommit !== b.hasSoftCommit) return a.hasSoftCommit ? -1 : 1;
        return b.highestConfidence - a.highestConfidence;
      });

      return {
        orderBook,
        totalSignals: signals.length,
        softCommitCount: signals.filter(s => s.signalType === "soft_commit").length,
        interestCount: signals.filter(s => s.signalType === "interest").length,
        objectionCount: signals.filter(s => s.signalType === "objection").length,
        totalInvestors: investors.length,
        completedMeetings: meetings.filter(m => m.status === "completed").length,
        totalMeetings: meetings.length,
      };
    }),
});
