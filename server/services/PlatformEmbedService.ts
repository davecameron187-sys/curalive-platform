import { getDb } from "../db";
import { liveQaPlatformShares, liveQaSessions, liveQaQuestions, liveQaAnswers, liveQaComplianceFlags } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

type Platform = "zoom" | "teams" | "webex" | "meet" | "generic";
type ShareType = "link" | "embed" | "widget";

const PLATFORM_LABELS: Record<Platform, string> = {
  zoom: "Zoom",
  teams: "Microsoft Teams",
  webex: "Webex",
  meet: "Google Meet",
  generic: "Meeting",
};

export async function generateShareLink(
  sessionId: number,
  sessionCode: string,
  platform: Platform,
  baseUrl: string
): Promise<{ shareLink: string; chatMessage: string }> {
  const db = await getDb();

  const [session] = await db.select().from(liveQaSessions).where(eq(liveQaSessions.id, sessionId));
  if (!session || session.sessionCode !== sessionCode) {
    throw new Error("Session ID and code mismatch");
  }

  const shareLink = `${baseUrl}/qa/${sessionCode}?utm_source=${platform}&utm_medium=chat`;

  await db.insert(liveQaPlatformShares).values({
    sessionId,
    platform,
    shareType: "link",
    shareLink,
  });

  const platformLabel = PLATFORM_LABELS[platform];
  const chatMessage = `${platformLabel} Live Q&A is open! Join via your browser — follow the live transcript and submit questions. No dial-in needed:\n${shareLink}`;

  return { shareLink, chatMessage };
}

export function getEmbedCode(
  sessionCode: string,
  baseUrl: string,
  options: {
    whiteLabel?: boolean;
    brandName?: string;
    brandColor?: string;
    width?: number;
    height?: number;
    hideBranding?: boolean;
  } = {}
): string {
  const {
    whiteLabel = false,
    brandName,
    brandColor,
    width = 400,
    height = 640,
    hideBranding = false,
  } = options;

  const params = new URLSearchParams();
  if (whiteLabel) params.set("theme", "platform");
  if (brandName) params.set("brandName", brandName);
  if (brandColor) params.set("brandColor", brandColor);
  if (hideBranding) params.set("hideBranding", "1");

  const queryString = params.toString();
  const url = `${baseUrl}/embed/qa/${sessionCode}${queryString ? `?${queryString}` : ""}`;

  return `<iframe\n  src="${url}"\n  width="${width}"\n  height="${height}"\n  frameborder="0"\n  allow="clipboard-write"\n  style="border-radius: 12px; border: 1px solid #2a2a4a;"\n></iframe>`;
}

export async function trackEmbedShare(
  sessionId: number,
  platform: Platform,
  shareType: ShareType,
  shareLink: string,
  whiteLabel: boolean = false,
  brandName?: string,
  brandColor?: string
) {
  const db = await getDb();
  await db.insert(liveQaPlatformShares).values({
    sessionId,
    platform,
    shareType,
    shareLink,
    whiteLabel,
    brandName,
    brandColor,
  });
}

export async function getShareAnalytics(sessionId: number) {
  const db = await getDb();
  const shares = await db
    .select()
    .from(liveQaPlatformShares)
    .where(eq(liveQaPlatformShares.sessionId, sessionId))
    .orderBy(desc(liveQaPlatformShares.createdAt));

  const byPlatform: Record<string, number> = {};
  const byType: Record<string, number> = {};
  shares.forEach((s) => {
    byPlatform[s.platform] = (byPlatform[s.platform] || 0) + 1;
    byType[s.shareType] = (byType[s.shareType] || 0) + 1;
  });

  return {
    totalShares: shares.length,
    byPlatform,
    byType,
    shares: shares.slice(0, 20),
  };
}

export async function generateEventSummary(sessionId: number) {
  const db = await getDb();

  const [session] = await db
    .select()
    .from(liveQaSessions)
    .where(eq(liveQaSessions.id, sessionId));

  if (!session) throw new Error("Session not found");

  const questions = await db
    .select()
    .from(liveQaQuestions)
    .where(eq(liveQaQuestions.sessionId, sessionId))
    .orderBy(desc(liveQaQuestions.priorityScore));

  const allAnswers = await db
    .select()
    .from(liveQaAnswers)
    .where(
      sql`${liveQaAnswers.questionId} IN (SELECT id FROM live_qa_questions WHERE session_id = ${sessionId})`
    );

  const answers = allAnswers.filter(a => !a.isAutoDraft || a.approvedByOperator);

  const complianceFlags = await db
    .select()
    .from(liveQaComplianceFlags)
    .where(
      sql`${liveQaComplianceFlags.questionId} IN (SELECT id FROM live_qa_questions WHERE session_id = ${sessionId})`
    );

  const categoryBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  let totalTriageScore = 0;
  let totalComplianceRisk = 0;
  let triageCount = 0;
  let complianceCount = 0;

  questions.forEach((q) => {
    categoryBreakdown[q.category] = (categoryBreakdown[q.category] || 0) + 1;
    statusBreakdown[q.status] = (statusBreakdown[q.status] || 0) + 1;
    if (q.triageScore != null) {
      totalTriageScore += q.triageScore;
      triageCount++;
    }
    if (q.complianceRiskScore != null) {
      totalComplianceRisk += q.complianceRiskScore;
      complianceCount++;
    }
  });

  const topQuestions = questions
    .filter((q) => q.status !== "rejected")
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    .slice(0, 10)
    .map((q) => ({
      id: q.id,
      text: q.questionText,
      category: q.category,
      upvotes: q.upvotes || 0,
      status: q.status,
      triageScore: q.triageScore,
      complianceRiskScore: q.complianceRiskScore,
      submitter: q.isAnonymous ? "Anonymous" : q.submitterName || "Anonymous",
    }));

  const unresolvedFlags = complianceFlags.filter((f) => !f.resolved);
  const flagsByJurisdiction: Record<string, number> = {};
  const flagsByRiskType: Record<string, number> = {};
  complianceFlags.forEach((f) => {
    flagsByJurisdiction[f.jurisdiction] = (flagsByJurisdiction[f.jurisdiction] || 0) + 1;
    flagsByRiskType[f.riskType] = (flagsByRiskType[f.riskType] || 0) + 1;
  });

  const avgSentiment =
    complianceCount > 0
      ? totalComplianceRisk / complianceCount <= 30
        ? "Positive"
        : totalComplianceRisk / complianceCount <= 60
        ? "Neutral"
        : "Cautious"
      : "Neutral";

  const shareAnalytics = await getShareAnalytics(sessionId).catch(() => null);

  return {
    session: {
      id: session.id,
      eventName: session.eventName,
      clientName: session.clientName,
      sessionCode: session.sessionCode,
      status: session.status,
      createdAt: session.createdAt,
      closedAt: session.closedAt,
    },
    metrics: {
      totalQuestions: questions.length,
      totalAnswered: answers.length,
      totalApproved: statusBreakdown["approved"] || 0,
      totalRejected: statusBreakdown["rejected"] || 0,
      totalFlagged: statusBreakdown["flagged"] || 0,
      responseRate:
        questions.length > 0
          ? Math.round((answers.length / questions.length) * 100)
          : 0,
      averageTriageScore:
        triageCount > 0 ? Math.round(totalTriageScore / triageCount) : 0,
      averageComplianceRisk:
        complianceCount > 0
          ? Math.round(totalComplianceRisk / complianceCount)
          : 0,
      overallSentiment: avgSentiment,
    },
    categoryBreakdown,
    statusBreakdown,
    topQuestions,
    compliance: {
      totalFlags: complianceFlags.length,
      unresolvedFlags: unresolvedFlags.length,
      flagsByJurisdiction,
      flagsByRiskType,
      highRiskFlags: complianceFlags
        .filter((f) => f.riskScore >= 70)
        .map((f) => ({
          jurisdiction: f.jurisdiction,
          riskType: f.riskType,
          riskScore: f.riskScore,
          description: f.riskDescription,
          resolved: f.resolved,
        })),
    },
    distribution: shareAnalytics,
    generatedAt: Date.now(),
  };
}
