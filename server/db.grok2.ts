/**
 * GROK2 Database Helper Functions
 * Live Q&A Intelligence Engine (Module 31) — Phase 1-2
 * All helper functions return raw Drizzle rows for use in tRPC procedures
 */

import { getDb } from "./db";
import {
  liveQaQuestions,
  liveQaAnswers,
  triageEvents,
  investorContextCards,
  complianceFlags,
  smartQueueEvents,
  privateAiBotConversations,
  blockchainCertificates,
  liveQaSessionMetadata,
} from "../drizzle/schema";
import { eq, and, desc, asc, gt, lt, gte, lte } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// LIVE Q&A QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getQuestionsBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(liveQaQuestions)
    .where(eq(liveQaQuestions.sessionId, sessionId))
    .orderBy(desc(liveQaQuestions.createdAt));
}

export async function getQuestionById(questionId: number) {
  const db = await getDb();
  if (!db) return null;
  return db
    .select()
    .from(liveQaQuestions)
    .where(eq(liveQaQuestions.id, questionId))
    .then((rows) => rows[0] || null);
}

export async function getUnansweredQuestions(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(liveQaQuestions)
    .where(
      and(
        eq(liveQaQuestions.sessionId, sessionId),
        eq(liveQaQuestions.isAnswered, false),
        eq(liveQaQuestions.status, "approved")
      )
    )
    .orderBy(desc(liveQaQuestions.priorityScore));
}

export async function getHighRiskQuestions(sessionId: string, riskThreshold = 0.7) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(liveQaQuestions)
    .where(
      and(
        eq(liveQaQuestions.sessionId, sessionId),
        gte(liveQaQuestions.complianceRiskScore, riskThreshold)
      )
    )
    .orderBy(desc(liveQaQuestions.complianceRiskScore));
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE Q&A ANSWERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAnswersByQuestion(questionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(liveQaAnswers)
    .where(eq(liveQaAnswers.questionId, questionId))
    .orderBy(desc(liveQaAnswers.createdAt));
}

export async function getApprovedAnswers(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(liveQaAnswers)
    .where(
      and(
        eq(liveQaAnswers.sessionId, sessionId),
        eq(liveQaAnswers.isApproved, true)
      )
    )
    .orderBy(desc(liveQaAnswers.createdAt));
}

export async function getComplianceApprovedAnswers(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(liveQaAnswers)
    .where(
      and(
        eq(liveQaAnswers.sessionId, sessionId),
        eq(liveQaAnswers.isComplianceApproved, true)
      )
    )
    .orderBy(desc(liveQaAnswers.createdAt));
}

export async function getAutoDraftAnswers(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(liveQaAnswers)
    .where(
      and(
        eq(liveQaAnswers.sessionId, sessionId),
        eq(liveQaAnswers.isAutoDraft, true)
      )
    )
    .orderBy(desc(liveQaAnswers.createdAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE FLAGS
// ─────────────────────────────────────────────────────────────────────────────

export async function getComplianceFlagsForQuestion(questionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(complianceFlags)
    .where(eq(complianceFlags.questionId, questionId))
    .orderBy(desc(complianceFlags.riskScore));
}

export async function getUnresolvedComplianceFlags(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(complianceFlags)
    .where(
      and(
        eq(complianceFlags.sessionId, sessionId),
        eq(complianceFlags.isResolved, false)
      )
    )
    .orderBy(desc(complianceFlags.riskScore));
}

export async function getComplianceFlagsByJurisdiction(sessionId: string, jurisdiction: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(complianceFlags)
    .where(
      and(
        eq(complianceFlags.sessionId, sessionId),
        eq(complianceFlags.jurisdiction, jurisdiction)
      )
    )
    .orderBy(desc(complianceFlags.riskScore));
}

export async function getHighRiskComplianceFlags(sessionId: string, riskThreshold = 0.7) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(complianceFlags)
    .where(
      and(
        eq(complianceFlags.sessionId, sessionId),
        gte(complianceFlags.riskScore, riskThreshold)
      )
    )
    .orderBy(desc(complianceFlags.riskScore));
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE AI BOT CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPrivateConversations(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(privateAiBotConversations)
    .where(eq(privateAiBotConversations.sessionId, sessionId))
    .orderBy(desc(privateAiBotConversations.createdAt));
}

export async function getUnresolvedPrivateConversations(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(privateAiBotConversations)
    .where(
      and(
        eq(privateAiBotConversations.sessionId, sessionId),
        eq(privateAiBotConversations.isResolved, false)
      )
    )
    .orderBy(desc(privateAiBotConversations.createdAt));
}

export async function getPrivateConversationsRoutedToLegal(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(privateAiBotConversations)
    .where(
      and(
        eq(privateAiBotConversations.sessionId, sessionId),
        eq(privateAiBotConversations.routedToLegal, true)
      )
    )
    .orderBy(desc(privateAiBotConversations.routedToLegalAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCKCHAIN CERTIFICATES
// ─────────────────────────────────────────────────────────────────────────────

export async function getCertificatesForQuestion(questionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blockchainCertificates)
    .where(eq(blockchainCertificates.questionId, questionId))
    .orderBy(desc(blockchainCertificates.createdAt));
}

export async function getVerifiedCertificates(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blockchainCertificates)
    .where(
      and(
        eq(blockchainCertificates.sessionId, sessionId),
        eq(blockchainCertificates.isVerified, true)
      )
    )
    .orderBy(desc(blockchainCertificates.createdAt));
}

export async function getCertificatesByType(sessionId: string, certificationType: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blockchainCertificates)
    .where(
      and(
        eq(blockchainCertificates.sessionId, sessionId),
        eq(blockchainCertificates.certificationType, certificationType)
      )
    )
    .orderBy(desc(blockchainCertificates.createdAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE Q&A SESSION METADATA
// ─────────────────────────────────────────────────────────────────────────────

export async function getSessionMetadata(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  return db
    .select()
    .from(liveQaSessionMetadata)
    .where(eq(liveQaSessionMetadata.sessionId, sessionId))
    .then((rows) => rows[0] || null);
}

export async function getActiveSessions(eventId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(liveQaSessionMetadata)
    .where(
      and(
        eq(liveQaSessionMetadata.eventId, eventId),
        eq(liveQaSessionMetadata.isLive, true)
      )
    )
    .orderBy(desc(liveQaSessionMetadata.startedAt));
}

export async function getSessionsByEvent(eventId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(liveQaSessionMetadata)
    .where(eq(liveQaSessionMetadata.eventId, eventId))
    .orderBy(desc(liveQaSessionMetadata.startedAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATION & ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export async function getSessionStats(sessionId: string) {
  const session = await getSessionMetadata(sessionId);
  if (!session) return null;

  const questions = await getQuestionsBySession(sessionId);
  const answers = await getApprovedAnswers(sessionId);
  const complianceFlagsData = await getUnresolvedComplianceFlags(sessionId);
  const privateConversations = await getPrivateConversations(sessionId);
  const certificates = await getVerifiedCertificates(sessionId);

  return {
    sessionId,
    totalQuestions: questions.length,
    totalAnswered: answers.length,
    totalComplianceFlags: complianceFlagsData.length,
    totalPrivateConversations: privateConversations.length,
    totalCertificates: certificates.length,
    avgTriageScore:
      questions.length > 0
        ? questions.reduce((sum, q) => sum + (q.triageScore || 0), 0) / questions.length
        : 0,
    avgComplianceRisk:
      questions.length > 0
        ? questions.reduce((sum, q) => sum + (q.complianceRiskScore || 0), 0) / questions.length
        : 0,
    highRiskCount: questions.filter((q) => (q.complianceRiskScore || 0) > 0.7).length,
  };
}
