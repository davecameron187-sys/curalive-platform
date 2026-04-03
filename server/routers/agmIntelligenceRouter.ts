import { z } from "zod";
import { router, publicProcedure, operatorProcedure } from "../_core/trpc";
import { rawSql } from "../db";

const DISSENT_KEYWORDS = ["vote against", "oppose", "reject", "excessive", "unacceptable", "shareholder revolt", "proxy fight"];
const PROXY_ADVISORS = ["ISS", "Glass Lewis", "Hermes", "Sustainalytics", "PIRC"];

export const agmIntelligenceRouter = router({
  createResolution: operatorProcedure
    .input(z.object({
      sessionId: z.number().int(),
      resolutionNumber: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [rows] = await rawSql(
        `INSERT INTO agm_resolutions (session_id, resolution_number, title, description, category)
         VALUES ($1, $2, $3, $4, $5)`,
        [input.sessionId, input.resolutionNumber || null, input.title, input.description || null, input.category || null]
      );
      return { success: true, id: rows[0]?.id };
    }),

  getResolutions: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT * FROM agm_resolutions WHERE session_id = $1 ORDER BY resolution_number ASC`,
        [input.sessionId]
      );
      return rows;
    }),

  updateResolution: operatorProcedure
    .input(z.object({
      resolutionId: z.number().int(),
      sentiment: z.string().optional(),
      sentimentScore: z.number().optional(),
      dissentLevel: z.string().optional(),
      votesFor: z.number().int().optional(),
      votesAgainst: z.number().int().optional(),
      abstentions: z.number().int().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(input)) {
        if (key === "resolutionId" || val === undefined) continue;
        const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        updates.push(`${col} = $${idx++}`);
        params.push(val);
      }
      if (updates.length === 0) return { success: true };
      params.push(input.resolutionId);
      await rawSql(`UPDATE agm_resolutions SET ${updates.join(", ")} WHERE id = $${idx}`, params);
      return { success: true };
    }),

  analyseAgmSegment: operatorProcedure
    .input(z.object({
      sessionId: z.number().int(),
      segmentText: z.string(),
      speaker: z.string().optional(),
      timestamp: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const text = input.segmentText.toLowerCase();
      const signals: any[] = [];

      for (const keyword of DISSENT_KEYWORDS) {
        if (text.includes(keyword)) {
          signals.push({
            signalType: "dissent",
            confidence: 0.85,
            keyword,
          });
        }
      }

      for (const advisor of PROXY_ADVISORS) {
        if (text.includes(advisor.toLowerCase())) {
          signals.push({
            signalType: "proxy_advisor_reference",
            confidence: 0.95,
            keyword: advisor,
          });
        }
      }

      if (text.match(/activist|institutional investor|block vote|coordinated/i)) {
        signals.push({ signalType: "activist_language", confidence: 0.75 });
      }

      for (const signal of signals) {
        await rawSql(
          `INSERT INTO agm_shareholder_signals (session_id, signal_type, speaker, segment_text, confidence)
           VALUES ($1, $2, $3, $4, $5)`,
          [input.sessionId, signal.signalType, input.speaker || null, input.segmentText, signal.confidence]
        );
      }

      return { signals };
    }),

  getSignals: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT * FROM agm_shareholder_signals WHERE session_id = $1 ORDER BY detected_at DESC`,
        [input.sessionId]
      );
      return rows;
    }),

  getAgmDashboard: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input }) => {
      const [resolutions] = await rawSql(
        `SELECT * FROM agm_resolutions WHERE session_id = $1 ORDER BY resolution_number`,
        [input.sessionId]
      );
      const [signals] = await rawSql(
        `SELECT * FROM agm_shareholder_signals WHERE session_id = $1 ORDER BY detected_at DESC`,
        [input.sessionId]
      );
      return {
        resolutions,
        signals,
        dissentCount: signals.filter((s: any) => s.signal_type === "dissent").length,
        proxyAdvisorRefs: signals.filter((s: any) => s.signal_type === "proxy_advisor_reference").length,
        activistSignals: signals.filter((s: any) => s.signal_type === "activist_language").length,
      };
    }),

  generatePostAgmReport: operatorProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ input }) => {
      const [resolutions] = await rawSql(
        `SELECT * FROM agm_resolutions WHERE session_id = $1`,
        [input.sessionId]
      );
      const [signals] = await rawSql(
        `SELECT * FROM agm_shareholder_signals WHERE session_id = $1`,
        [input.sessionId]
      );

      try {
        const { invokeLLM } = await import("../_core/llm");
        const result = await invokeLLM({
          messages: [
            { role: "system", content: "You are a corporate governance analyst. Generate a structured post-AGM dissent report." },
            { role: "user", content: `Generate a post-AGM dissent report. Resolutions: ${JSON.stringify(resolutions)}. Signals detected: ${JSON.stringify(signals)}. Cover: overall dissent level, resolution-by-resolution analysis, activist activity, proxy advisor impact, and recommended board actions.` },
          ],
        });
        return { success: true, report: typeof result === "string" ? result : (result as any)?.content || "Report generation completed." };
      } catch (err: any) {
        return { success: false, error: err?.message, report: null };
      }
    }),
});
