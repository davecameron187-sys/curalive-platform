// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, operatorProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";
import { liveQaSessions, liveQaQuestions, liveQaAnswers, liveQaComplianceFlags, shadowSessions } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getAblyClient } from "../_core/ably";
import { triageQuestion, generateAutoDraft, authoriseGoLive } from "../services/LiveQaTriageService";
import { publishToChannel } from "../_core/ably";
import { generateAutonomousTools } from "../services/AgiToolGeneratorService";
import { predictiveRiskAnalysis } from "../services/AgiComplianceService";
import { createHash } from "crypto";

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const DUPLICATE_THRESHOLD = 0.55;

function findDuplicate(newQuestion: string, existingQuestions: Array<{ id: number; text: string }>): { id: number; similarity: number } | null {
  let bestMatch: { id: number; similarity: number } | null = null;
  for (const eq of existingQuestions) {
    const sim = jaccardSimilarity(newQuestion, eq.text);
    if (sim >= DUPLICATE_THRESHOLD && (!bestMatch || sim > bestMatch.similarity)) {
      bestMatch = { id: eq.id, similarity: sim };
    }
  }
  return bestMatch;
}

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

      let ablyChannel: string | null = null;
      let shadowStatus: string | null = null;
      if (session.shadowSessionId) {
        const [shadow] = await db
          .select({ ablyChannel: shadowSessions.ablyChannel, status: shadowSessions.status })
          .from(shadowSessions)
          .where(eq(shadowSessions.id, session.shadowSessionId));
        if (shadow) {
          ablyChannel = shadow.ablyChannel;
          shadowStatus = shadow.status;
        }
      }

      return {
        id: session.id,
        sessionCode: session.sessionCode,
        eventName: session.eventName,
        clientName: session.clientName,
        status: session.status,
        totalQuestions: session.totalQuestions,
        ablyChannel,
        isLiveStreaming: shadowStatus === "live" || shadowStatus === "bot_joining",
      };
    }),

  getAttendeeAblyToken: publicProcedure
    .input(z.object({ accessCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [session] = await db
        .select()
        .from(liveQaSessions)
        .where(eq(liveQaSessions.sessionCode, input.accessCode.toUpperCase()));
      if (!session || !session.shadowSessionId) return { tokenRequest: null };
      if (session.status === "closed") return { tokenRequest: null };

      const [shadow] = await db
        .select({ ablyChannel: shadowSessions.ablyChannel, status: shadowSessions.status })
        .from(shadowSessions)
        .where(eq(shadowSessions.id, session.shadowSessionId));
      if (!shadow?.ablyChannel) return { tokenRequest: null };
      if (shadow.status !== "live" && shadow.status !== "bot_joining") return { tokenRequest: null };

      try {
        const client = await getAblyClient();
        if (!client) return { tokenRequest: null };
        const tokenRequest = await client.auth.createTokenRequest({
          clientId: `attendee-${input.accessCode}-${Date.now()}`,
          ttl: 900000,
          capability: JSON.stringify({
            [shadow.ablyChannel]: ["subscribe"],
          }),
        });
        return { tokenRequest, channel: shadow.ablyChannel };
      } catch (err) {
        console.error("[LiveQA] Failed to generate attendee Ably token:", err);
        return { tokenRequest: null };
      }
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
        .select({ id: liveQaQuestions.id, text: liveQaQuestions.questionText })
        .from(liveQaQuestions)
        .where(eq(liveQaQuestions.sessionId, session.id))
        .limit(200);

      const triage = await triageQuestion(
        input.questionText,
        session.eventName,
        session.clientName || "",
        existingQs.map(q => q.text)
      );

      const duplicateMatch = findDuplicate(input.questionText, existingQs.map(q => ({ id: q.id, text: q.text })));
      const isDuplicate = !!duplicateMatch;
      const effectiveClassification = isDuplicate ? "duplicate" : triage.triageClassification;
      const effectiveStatus = triage.complianceRiskScore > 70 ? "flagged" : "triaged";

      const nowEpoch = String(Date.now());
    const [insertResult] = await rawSql(
        `INSERT INTO live_qa_questions (session_id, question_text, submitter_name, submitter_email, submitter_company, question_category, question_status, upvotes, triage_score, triage_classification, triage_reason, compliance_risk_score, priority_score, is_anonymous, duplicate_of_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          input.questionText,
          input.isAnonymous ? null : (input.submitterName || null),
          input.isAnonymous ? null : (input.submitterEmail || null),
          input.isAnonymous ? null : (input.submitterCompany || null),
          triage.category,
          effectiveStatus,
          triage.triageScore,
          effectiveClassification,
          isDuplicate ? `Possible duplicate of Q#${duplicateMatch!.id} (${Math.round(duplicateMatch!.similarity * 100)}% match). ${triage.triageReason}` : triage.triageReason,
          triage.complianceRiskScore,
          isDuplicate ? Math.max(0, triage.priorityScore - 20) : triage.priorityScore,
          input.isAnonymous ? 1 : 0,
          duplicateMatch?.id || null,
          nowEpoch,
          nowEpoch,
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
      sortBy: z.enum(["priority", "time", "compliance"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
    let query = `SELECT q.*, 
        (SELECT COUNT(*) FROM live_qa_answers a WHERE a.question_id = q.id) as answer_count,
        (SELECT COUNT(*) FROM live_qa_compliance_flags f WHERE f.question_id = q.id AND f.resolved = false) as unresolved_flags,
        (SELECT COUNT(*) FROM live_qa_questions d WHERE d.duplicate_of_id = q.id) as duplicate_count
        FROM live_qa_questions q WHERE q.session_id = ?`;
      const params: any[] = [input.sessionId];

      const filter = input.statusFilter || "all";
      if (filter === "legal_review") {
        query += ` AND q.legal_review_reason IS NOT NULL`;
      } else if (filter === "duplicates") {
        query += ` AND q.duplicate_of_id IS NOT NULL`;
      } else if (filter === "unanswered") {
        query += ` AND q.question_status NOT IN ('answered', 'rejected')`;
      } else if (filter === "high_priority") {
        query += ` AND (q.triage_classification = 'high_priority' OR q.compliance_risk_score > 60)`;
      } else if (filter === "sent_to_speaker") {
        query += ` AND q.operator_notes LIKE '%Sent to speaker%'`;
      } else if (filter !== "all") {
        query += ` AND q.question_status = ?`;
        params.push(filter);
      }

      const sortBy = input.sortBy || "priority";
      const sortOrder = (input.sortOrder || "desc").toUpperCase();
      if (sortBy === "compliance") {
        query += ` ORDER BY q.compliance_risk_score ${sortOrder}, q.priority_score DESC`;
      } else if (sortBy === "time") {
        query += ` ORDER BY q.created_at ${sortOrder}`;
      } else {
        query += ` ORDER BY q.priority_score ${sortOrder}, q.created_at DESC`;
      }

      const [rows] = await rawSql(query, params);
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
    const [rows] = await rawSql(
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
      const [existing] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!existing) throw new Error("Question not found");

      const oldStatus = existing.questionStatus;
      if (oldStatus === input.status && !input.operatorNotes) return { success: true };

      const nowEpoch = String(Date.now());
      const updates: any = { status: input.status, updatedAt: nowEpoch };
      if (input.operatorNotes !== undefined) updates.operatorNotes = input.operatorNotes;
      await db.update(liveQaQuestions).set(updates).where(eq(liveQaQuestions.id, input.questionId));

      if (oldStatus !== input.status) {
        const wasApproved = oldStatus === "approved";
        const wasRejected = oldStatus === "rejected";
        const isApproved = input.status === "approved";
        const isRejected = input.status === "rejected";
        if (wasApproved && !isApproved) await rawSql(`UPDATE live_qa_sessions SET total_approved = GREATEST(0, total_approved - 1) WHERE id = ?`, [existing.sessionId]);
        if (wasRejected && !isRejected) await rawSql(`UPDATE live_qa_sessions SET total_rejected = GREATEST(0, total_rejected - 1) WHERE id = ?`, [existing.sessionId]);
        if (!wasApproved && isApproved) await rawSql(`UPDATE live_qa_sessions SET total_approved = total_approved + 1 WHERE id = ?`, [existing.sessionId]);
        if (!wasRejected && isRejected) await rawSql(`UPDATE live_qa_sessions SET total_rejected = total_rejected + 1 WHERE id = ?`, [existing.sessionId]);
      }

      publishToChannel(`curalive-qa-${existing.sessionId}`, "qa.statusChanged", {
        questionId: input.questionId,
        newStatus: input.status,
        operatorNotes: input.operatorNotes || null,
        timestamp: Date.now(),
      }).catch(() => {});

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

  setLegalReview: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      reason: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(liveQaQuestions)
        .set({
          status: "flagged",
          operatorNotes: `Legal Review: ${input.reason}`,
          updatedAt: Date.now(),
        })
        .where(eq(liveQaQuestions.id, input.questionId));
      await rawSql(`UPDATE live_qa_questions SET legal_review_reason = ? WHERE id = ?`, [input.reason, input.questionId]);
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (q) {
        publishToChannel(`curalive-qa-${q.sessionId}`, "qa.statusChanged", {
          questionId: input.questionId,
          newStatus: "flagged",
          legalReview: true,
          reason: input.reason,
          timestamp: Date.now(),
        }).catch(() => {});
      }
      return { success: true };
    }),

  clearLegalReview: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ input }) => {
      await rawSql(`UPDATE live_qa_questions SET legal_review_reason = NULL WHERE id = ?`, [input.questionId]);
      return { success: true };
    }),

  getDuplicatesOf: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .query(async ({ input }) => {
      const [rows] = await rawSql(
        `SELECT id, question_text, submitter_name, submitter_company, question_status, created_at
         FROM live_qa_questions WHERE duplicate_of_id = ?
         ORDER BY created_at DESC`,
        [input.questionId]
      );
      return rows || [];
    }),

  unlinkDuplicate: operatorProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ input }) => {
      await rawSql(`UPDATE live_qa_questions SET duplicate_of_id = NULL, triage_classification = 'standard' WHERE id = ?`, [input.questionId]);
      return { success: true };
    }),

  linkDuplicate: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      duplicateOfId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await rawSql(`UPDATE live_qa_questions SET duplicate_of_id = ?, triage_classification = 'duplicate' WHERE id = ?`, [input.duplicateOfId, input.questionId]);
      return { success: true };
    }),

  generateContextDraft: operatorProcedure
    .input(z.object({
      questionId: z.number(),
      includeTranscript: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [q] = await db.select().from(liveQaQuestions).where(eq(liveQaQuestions.id, input.questionId));
      if (!q) throw new Error("Question not found");

      const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, q.sessionId));
      if (!session) throw new Error("Session not found");

      let transcriptContext = "";
      if (input.includeTranscript && session.shadowSessionId) {
        try {
          const [transcriptRows] = await rawSql(
            `SELECT transcript_json FROM recall_bots WHERE recall_bot_id = (SELECT recall_bot_id FROM shadow_sessions WHERE id = ?)`,
            [session.shadowSessionId]
          );
          if (transcriptRows?.[0]?.transcript_json) {
            const segments = JSON.parse(transcriptRows[0].transcript_json);
            const recentSegments = segments.slice(-20);
            transcriptContext = recentSegments.map((s: any) => `${s.speaker || "Speaker"}: ${s.text}`).join("\n");
          }
        } catch {}
      }

      const draft = await generateAutoDraft(
        q.questionText + (transcriptContext ? `\n\nRecent transcript context:\n${transcriptContext}` : ""),
        session.eventName,
        session.clientName || "",
        q.category
      );

      await rawSql(
        `UPDATE live_qa_questions SET ai_draft_text = ?, ai_draft_reasoning = ? WHERE id = ?`,
        [draft.answerText, draft.reasoning, input.questionId]
      );

      return draft;
    }),

  bulkAction: operatorProcedure
    .input(z.object({
      questionIds: z.array(z.number()).min(1).max(50),
      action: z.enum(["approve", "reject", "flagged", "legal_review"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      let processed = 0;
      for (const qId of input.questionIds) {
        try {
          if (input.action === "legal_review") {
            await db.update(liveQaQuestions)
              .set({ status: "flagged", operatorNotes: `Legal Review: ${input.reason || "Bulk escalation"}`, updatedAt: Date.now() })
              .where(eq(liveQaQuestions.id, qId));
            await rawSql(`UPDATE live_qa_questions SET legal_review_reason = ? WHERE id = ?`, [input.reason || "Bulk escalation", qId]);
          } else {
            const notes = input.action === "approve" ? "Bulk approved" : input.action === "reject" ? "Bulk rejected" : "Bulk flagged";
            await db.update(liveQaQuestions)
              .set({ status: input.action, operatorNotes: notes, updatedAt: Date.now() })
              .where(eq(liveQaQuestions.id, qId));
          }
          processed++;
        } catch {}
      }
      return { success: true, processed, total: input.questionIds.length };
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
    await rawSql(`UPDATE live_qa_sessions SET total_approved = total_approved + 1 WHERE id = ?`, [q.sessionId]);

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
