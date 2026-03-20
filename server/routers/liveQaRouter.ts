// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, operatorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { liveQaSessions, liveQaQuestions, liveQaAnswers, liveQaComplianceFlags } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { triageQuestion, generateAutoDraft } from "../services/LiveQaTriageService";

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const upvoteTracker = new Map<string, number>();
const UPVOTE_COOLDOWN_MS = 10_000;

export const liveQaRouter = router({
  createSession: operatorProcedure
    .input(z.object({
      eventName: z.string().min(1),
      clientName: z.string().optional(),
      shadowSessionId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const sessionCode = generateSessionCode();
      await db.insert(liveQaSessions).values({
        sessionCode,
        eventName: input.eventName,
        clientName: input.clientName || null,
        shadowSessionId: input.shadowSessionId || null,
      });
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, sessionCode));
      return session;
    }),

  getSession: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.id, input.sessionId));
      return session || null;
    }),

  getSessionByCode: publicProcedure
    .input(z.object({ accessCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, input.accessCode.toUpperCase()));
      if (!session) return null;
      return {
        id: session.id,
        sessionCode: session.sessionCode,
        eventName: session.eventName,
        clientName: session.clientName,
        status: session.status,
        totalQuestions: session.totalQuestions,
      };
    }),

  getSessionByShadow: operatorProcedure
    .input(z.object({ shadowSessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.shadowSessionId, input.shadowSessionId));
      return session || null;
    }),

  updateSessionStatus: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      status: z.enum(["active", "paused", "closed"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const updates: any = { status: input.status };
      if (input.status === "closed") updates.closedAt = new Date();
      await db.update(liveQaSessions).set(updates).where(eq(liveQaSessions.id, input.sessionId));
      return { success: true };
    }),

  submitQuestion: publicProcedure
    .input(z.object({
      sessionCode: z.string(),
      questionText: z.string().min(5).max(2000),
      submitterName: z.string().optional(),
      submitterEmail: z.string().email().optional(),
      submitterCompany: z.string().optional(),
      isAnonymous: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, input.sessionCode.toUpperCase()));
      if (!session) throw new Error("Q&A session not found");
      if (session.status === "closed") throw new Error("Q&A session is closed");
      if (session.status === "paused") throw new Error("Q&A session is paused");

      const existingQs = await db
        .select({ text: liveQaQuestions.questionText })
        .from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, session.id))
        .limit(50);

      const triage = await triageQuestion(
        input.questionText,
        session.eventName,
        session.clientName || "",
        existingQs.map(q => q.text)
      );

      const conn = (db as any).session?.client ?? (db as any).$client;
      const [insertResult] = await conn.execute(
        `INSERT INTO live_qa_questions (session_id, question_text, submitter_name, submitter_email, submitter_company, question_category, question_status, upvotes, triage_score, triage_classification, triage_reason, compliance_risk_score, priority_score, is_anonymous, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          input.questionText,
          input.isAnonymous ? null : (input.submitterName || null),
          input.submitterEmail || null,
          input.isAnonymous ? null : (input.submitterCompany || null),
          triage.category,
          triage.complianceRiskScore > 70 ? "flagged" : "triaged",
          triage.triageScore,
          triage.triageClassification,
          triage.triageReason,
          triage.complianceRiskScore,
          triage.priorityScore,
          input.isAnonymous ? 1 : 0,
          Date.now(),
          Date.now(),
        ]
      );

      const questionId = insertResult.insertId;

      if (triage.complianceFlags.length > 0 && questionId) {
        for (const flag of triage.complianceFlags) {
          await db.insert(liveQaComplianceFlags).values({
            questionId,
            jurisdiction: flag.jurisdiction || "global",
            riskScore: flag.riskScore || 0,
            riskType: flag.riskType || "unknown",
            riskDescription: flag.riskDescription || "",
            recommendedAction: flag.recommendedAction || "forward",
            autoRemediationSuggestion: flag.autoRemediationSuggestion || "",
          });
        }
      }

      await db.update(liveQaSessions)
        .set({ totalQuestions: sql`total_questions + 1` })
        .where(eq(liveQaSessions.id, session.id));

      return {
        questionId,
        category: triage.category,
        triageClassification: triage.triageClassification,
        status: triage.complianceRiskScore > 70 ? "flagged" : "triaged",
      };
    }),

  listQuestions: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      statusFilter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conn = (db as any).session?.client ?? (db as any).$client;
      let query = `SELECT q.*, 
        (SELECT COUNT(*) FROM live_qa_answers a WHERE a.question_id = q.id) as answer_count,
        (SELECT COUNT(*) FROM live_qa_compliance_flags f WHERE f.question_id = q.id AND f.resolved = 0) as unresolved_flags
        FROM live_qa_questions q WHERE q.session_id = ?`;
      const params: any[] = [input.sessionId];

      if (input.statusFilter && input.statusFilter !== "all") {
        query += ` AND q.question_status = ?`;
        params.push(input.statusFilter);
      }

      query += ` ORDER BY q.priority_score DESC, q.created_at DESC`;

      const [rows] = await conn.execute(query, params);
      return rows || [];
    }),

  listQuestionsPublic: publicProcedure
    .input(z.object({ sessionCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, input.sessionCode.toUpperCase()));
      if (!session) return [];

      const conn = (db as any).session?.client ?? (db as any).$client;
      const [rows] = await conn.execute(
        `SELECT id, question_text, question_category as category, question_status as status, 
                upvotes, submitter_name, submitter_company, is_anonymous, created_at
         FROM live_qa_questions 
         WHERE session_id = ? AND question_status IN ('triaged','approved','answered')
         ORDER BY upvotes DESC, created_at DESC`,
        [session.id]
      );
      return (rows || []).map((r: any) => ({
        ...r,
        submitterName: r.is_anonymous ? "Anonymous" : r.submitter_name,
        submitterCompany: r.is_anonymous ? null : r.submitter_company,
      }));
    }),

  upvoteQuestion: publicProcedure
    .input(z.object({
      questionId: z.number(),
      fingerprint: z.string().max(64).optional(),
    }))
    .mutation(async ({ input }) => {
      const key = `${input.fingerprint || "anon"}-${input.questionId}`;
      const lastVote = upvoteTracker.get(key);
      if (lastVote && Date.now() - lastVote < UPVOTE_COOLDOWN_MS) {
        throw new Error("Please wait before voting again");
      }
      upvoteTracker.set(key, Date.now());

      if (upvoteTracker.size > 10000) {
        const cutoff = Date.now() - 3600_000;
        for (const [k, v] of upvoteTracker) {
          if (v < cutoff) upvoteTracker.delete(k);
        }
      }

      const db = await getDb();
      await db.update(liveQaQuestions)
        .set({ upvotes: sql`upvotes + 1` })
        .where(eq(liveQaQuestions.id, input.questionId));
      return { success: true };
    }),

  updateQuestionStatus: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      status: z.enum(["pending", "triaged", "approved", "answered", "rejected", "flagged"]),
      operatorNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const updates: any = { status: input.status, updatedAt: Date.now() };
      if (input.operatorNotes !== undefined) updates.operatorNotes = input.operatorNotes;
      await db.update(liveQaQuestions).set(updates).where(eq(liveQaQuestions.id, input.questionId));

      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (q) {
        const field = input.status === "approved" ? "totalApproved" :
                      input.status === "rejected" ? "totalRejected" : null;
        if (field) {
          const col = field === "totalApproved" ? "total_approved" : "total_rejected";
          const conn = (db as any).session?.client ?? (db as any).$client;
          await conn.execute(`UPDATE live_qa_sessions SET ${col} = ${col} + 1 WHERE id = ?`, [q.sessionId]);
        }
      }

      return { success: true };
    }),

  generateDraft: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!q) throw new Error("Question not found");

      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, q.sessionId));
      if (!session) throw new Error("Session not found");

      const draft = await generateAutoDraft(
        q.questionText,
        session.eventName,
        session.clientName || "",
        q.category
      );

      await db.insert(liveQaAnswers).values({
        questionId: input.questionId,
        answerText: draft.answerText,
        isAutoDraft: true,
        autoDraftReasoning: draft.reasoning,
        approvedByOperator: false,
      });

      return draft;
    }),

  submitAnswer: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      answerText: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.insert(liveQaAnswers).values({
        questionId: input.questionId,
        answerText: input.answerText,
        isAutoDraft: false,
        approvedByOperator: true,
      });
      await db.update(liveQaQuestions)
        .set({ status: "answered", updatedAt: Date.now() })
        .where(eq(liveQaQuestions.id, input.questionId));
      return { success: true };
    }),

  getAnswers: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(liveQaAnswers).where(eq(liveQaAnswers.questionId, input.questionId));
    }),

  getComplianceFlags: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(liveQaComplianceFlags).where(eq(liveQaComplianceFlags.questionId, input.questionId));
    }),

  resolveComplianceFlag: operatorProcedure
    .input(z.object({ flagId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(liveQaComplianceFlags)
        .set({ resolved: true })
        .where(eq(liveQaComplianceFlags.id, input.flagId));
      return { success: true };
    }),

  listSessions: operatorProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(liveQaSessions).orderBy(desc(liveQaSessions.createdAt));
  }),
});
