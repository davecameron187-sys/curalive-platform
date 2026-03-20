// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, operatorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { liveQaSessions, liveQaQuestions, liveQaAnswers, liveQaComplianceFlags } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { triageQuestion, generateAutoDraft, authoriseGoLive } from "../services/LiveQaTriageService";
import { publishToChannel } from "../_core/ably";
import { generateAutonomousTools } from "../services/AgiToolGeneratorService";
import { predictiveRiskAnalysis } from "../services/AgiComplianceService";
import { createHash } from "crypto";

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
          input.isAnonymous ? null : (input.submitterEmail || null),
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

      publishToChannel(`curalive-qa-${session.id}`, "qa.submitted", {
        questionId,
        questionText: input.questionText,
        category: triage.category,
        triageClassification: triage.triageClassification,
        triageScore: triage.triageScore,
        priorityScore: triage.priorityScore,
        complianceRiskScore: triage.complianceRiskScore,
        status: triage.complianceRiskScore > 70 ? "flagged" : "triaged",
        timestamp: Date.now(),
      }).catch(() => {});

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

        publishToChannel(`curalive-qa-${q.sessionId}`, "qa.statusChanged", {
          questionId: input.questionId,
          newStatus: input.status,
          operatorNotes: input.operatorNotes || null,
          timestamp: Date.now(),
        }).catch(() => {});
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

      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (q) {
        publishToChannel(`curalive-qa-${q.sessionId}`, "qa.statusChanged", {
          questionId: input.questionId,
          newStatus: "answered",
          timestamp: Date.now(),
        }).catch(() => {});
      }

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

  sendToSpeaker: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      speakerNote: z.string().optional(),
      suggestedAnswer: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!q) throw new Error("Question not found");

      await db.update(liveQaQuestions)
        .set({ status: "approved", operatorNotes: input.speakerNote || "Sent to speaker", updatedAt: Date.now() })
        .where(eq(liveQaQuestions.id, input.questionId));

      publishToChannel(`curalive-qa-${q.sessionId}`, "qa.sentToSpeaker", {
        questionId: input.questionId,
        questionText: q.questionText,
        speakerNote: input.speakerNote || null,
        suggestedAnswer: input.suggestedAnswer || null,
        timestamp: Date.now(),
      }).catch(() => {});

      return { success: true };
    }),

  broadcastToTeam: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string().min(1).max(2000),
      priority: z.enum(["normal", "urgent"]).optional(),
    }))
    .mutation(async ({ input }) => {
      publishToChannel(`curalive-qa-${input.sessionId}`, "qa.teamBroadcast", {
        message: input.message,
        priority: input.priority || "normal",
        timestamp: Date.now(),
      }).catch(() => {});

      return { success: true, broadcastedAt: Date.now() };
    }),

  postIrChatMessage: operatorProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string().min(1).max(2000),
      senderRole: z.enum(["operator", "ir_team", "legal", "speaker"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const messageId = Date.now();

      publishToChannel(`curalive-qa-${input.sessionId}`, "qa.irChat", {
        id: messageId,
        message: input.message,
        senderRole: input.senderRole || "operator",
        timestamp: Date.now(),
      }).catch(() => {});

      return { success: true, messageId };
    }),

  generateQaCertificate: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, input.sessionId));
      if (!session) throw new Error("Session not found");

      const questions = await db.select().from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, input.sessionId))
        .orderBy(liveQaQuestions.createdAt);

      const answers = await db.select().from(liveQaAnswers)
        .where(sql`${liveQaAnswers.questionId} IN (SELECT id FROM live_qa_questions WHERE session_id = ${input.sessionId})`);

      const flags = await db.select().from(liveQaComplianceFlags)
        .where(sql`${liveQaComplianceFlags.questionId} IN (SELECT id FROM live_qa_questions WHERE session_id = ${input.sessionId})`);

      let previousHash = "GENESIS";
      const hashChain: Array<{ index: number; hash: string; previousHash: string; type: string; summary: string }> = [];

      const sessionPayload = JSON.stringify({
        sessionId: session.id,
        eventName: session.eventName,
        clientName: session.clientName,
        sessionCode: session.sessionCode,
        startedAt: session.createdAt,
        previousHash,
      });
      const sessionHash = createHash("sha256").update(sessionPayload).digest("hex");
      hashChain.push({ index: 0, hash: sessionHash, previousHash, type: "session_genesis", summary: `Session created: ${session.eventName}` });
      previousHash = sessionHash;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qPayload = JSON.stringify({
          questionId: q.id,
          text: q.questionText,
          category: q.category,
          status: q.status,
          triageScore: q.triageScore,
          complianceRiskScore: q.complianceRiskScore,
          createdAt: q.createdAt,
          previousHash,
        });
        const qHash = createHash("sha256").update(qPayload).digest("hex");
        hashChain.push({ index: i + 1, hash: qHash, previousHash, type: "question", summary: `Q${i + 1}: ${q.questionText?.slice(0, 60)}...` });
        previousHash = qHash;
      }

      const certificateHash = createHash("sha256").update(JSON.stringify(hashChain)).digest("hex");

      const totalAnswered = answers.filter(a => !a.isAutoDraft || a.approvedByOperator).length;
      const unresolvedFlags = flags.filter(f => !f.resolved).length;
      const complianceClean = unresolvedFlags === 0;

      const certificate = {
        certificateId: `CDC-QA-${session.sessionCode}-${Date.now()}`,
        type: "Clean Disclosure Certificate — Live Q&A Session",
        eventName: session.eventName,
        clientName: session.clientName,
        sessionCode: session.sessionCode,
        issuedAt: new Date().toISOString(),
        metrics: {
          totalQuestions: questions.length,
          totalAnswered,
          totalFlagged: flags.length,
          unresolvedFlags,
          responseRate: questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0,
        },
        complianceStatus: complianceClean ? "CLEAN" : "FLAGS_OUTSTANDING",
        certificateGrade: complianceClean
          ? (questions.length > 0 && totalAnswered / questions.length > 0.8 ? "AAA" : "AA")
          : (unresolvedFlags > 3 ? "B" : "BBB"),
        hashChain,
        certificateHash,
        chainLength: hashChain.length,
        verificationInstructions: "To verify: recompute SHA-256 hash chain from genesis block through each question segment. Final certificate hash must match.",
        disclaimer: "This certificate attests that all Q&A interactions during the specified session were processed through CuraLive's compliance screening engine. It does not constitute legal advice.",
        cipcPatent: "CIPC Patent App ID 1773575338868 | CIP5 | Claims 46-55",
      };

      return certificate;
    }),

  generateAgiTools: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, input.sessionId));
      if (!session) throw new Error("Session not found");

      const questions = await db.select().from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, input.sessionId));

      const categories: Record<string, number> = {};
      let totalRisk = 0;
      const themes: string[] = [];
      questions.forEach(q => {
        categories[q.category] = (categories[q.category] || 0) + 1;
        totalRisk += q.complianceRiskScore || 0;
        if (q.triageClassification === "high_priority") themes.push(q.questionText?.slice(0, 50) || "");
      });

      return generateAutonomousTools({
        eventName: session.eventName,
        clientName: session.clientName || "",
        totalQuestions: questions.length,
        categories,
        avgComplianceRisk: questions.length > 0 ? totalRisk / questions.length : 0,
        flaggedCount: questions.filter(q => q.status === "flagged").length,
        topThemes: themes.slice(0, 5),
      });
    }),

  goLive: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      minimumThreshold: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!q) throw new Error("Question not found");

      const authorisation = authoriseGoLive(
        q.triageScore || 0,
        q.complianceRiskScore || 0,
        input.minimumThreshold
      );

      if (authorisation.authorised) {
        await db.update(liveQaQuestions)
          .set({ status: "approved", operatorNotes: `Go Live authorised: ${authorisation.reason}`, updatedAt: Date.now() })
          .where(eq(liveQaQuestions.id, input.questionId));

        const conn = (db as any).session?.client ?? (db as any).$client;
        await conn.execute(`UPDATE live_qa_sessions SET total_approved = total_approved + 1 WHERE id = ?`, [q.sessionId]);

        publishToChannel(`curalive-qa-${q.sessionId}`, "qa.statusChanged", {
          questionId: input.questionId,
          newStatus: "approved",
          operatorNotes: `Go Live authorised: ${authorisation.reason}`,
          timestamp: Date.now(),
        }).catch(() => {});

        publishToChannel(`curalive-qa-${q.sessionId}`, "qa.goLive", {
          questionId: input.questionId,
          questionText: q.questionText,
          submitterName: q.submitterName,
          submitterCompany: q.submitterCompany,
          triageScore: q.triageScore,
          authorisation,
          timestamp: Date.now(),
        }).catch(() => {});
      }

      return authorisation;
    }),

  predictiveRisk: operatorProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, input.sessionId));
      if (!session) throw new Error("Session not found");

      const questions = await db.select().from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, input.sessionId));

      const flags = await db.select().from(liveQaComplianceFlags)
        .where(sql`${liveQaComplianceFlags.questionId} IN (SELECT id FROM live_qa_questions WHERE session_id = ${input.sessionId})`);

      return predictiveRiskAnalysis({
        eventName: session.eventName,
        clientName: session.clientName || "",
        questions: questions.map(q => ({
          text: q.questionText,
          category: q.category,
          complianceRiskScore: q.complianceRiskScore || 0,
          status: q.status,
        })),
        existingFlags: flags.map(f => ({
          jurisdiction: f.jurisdiction,
          riskType: f.riskType,
          riskScore: f.riskScore || 0,
        })),
      });
    }),
});
