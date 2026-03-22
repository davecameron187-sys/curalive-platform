// @ts-nocheck
/**
 * CuraLive Investor Engagement Scoring Service
 *
 * Tracks individual investors across multiple events to build relationship intelligence:
 * - Attendance patterns and frequency
 * - Question history and topic interests
 * - Sentiment trends over time
 * - Engagement score (composite metric)
 * - Churn prediction (probability of disengagement)
 * - Investor lifecycle stage classification
 *
 * Formula: EngagementScore = (Attendance×0.25) + (Participation×0.30) + (Recency×0.20) + (Consistency×0.15) + (Depth×0.10)
 */

import { invokeLLM } from "../_core/llm";

const WEIGHTS = {
  attendance: 0.25,
  participation: 0.30,
  recency: 0.20,
  consistency: 0.15,
  depth: 0.10,
};

const DECAY_HALF_LIFE_DAYS = 30;

function recencyDecay(lastInteractionDate: Date | string): number {
  const ageDays = (Date.now() - new Date(lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / DECAY_HALF_LIFE_DAYS);
}

export interface InvestorProfile {
  investorId: string;
  name: string;
  email?: string;
  company?: string;
  investorType: "institutional" | "retail" | "analyst" | "activist" | "insider" | "unknown";
  interactions: InvestorInteraction[];
  engagementScore: number;
  lifecycle: "new" | "engaged" | "loyal" | "at_risk" | "churned" | "reactivated";
  churnProbability: number;
  topTopics: string[];
  sentimentTrend: "improving" | "stable" | "declining";
  firstSeen: string;
  lastSeen: string;
  totalEvents: number;
  totalQuestions: number;
  avgSentiment: number;
}

export interface InvestorInteraction {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventType: string;
  attended: boolean;
  questionsAsked: number;
  questionTopics: string[];
  sentimentScore: number;
  upvotesGiven: number;
  sessionDuration?: number;
}

interface EngagementComponents {
  attendance: number;
  participation: number;
  recency: number;
  consistency: number;
  depth: number;
}

const profileStore = new Map<string, InvestorProfile>();

function generateInvestorId(name: string, email?: string): string {
  const key = email?.toLowerCase() || name.toLowerCase().replace(/\s+/g, "-");
  const { createHash } = require("crypto");
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

function computeEngagementComponents(profile: InvestorProfile): EngagementComponents {
  const interactions = profile.interactions;
  if (interactions.length === 0) {
    return { attendance: 0, participation: 0, recency: 0, consistency: 0, depth: 0 };
  }

  const attendedEvents = interactions.filter(i => i.attended).length;
  const attendance = Math.min(100, (attendedEvents / Math.max(1, attendedEvents + 2)) * 100);

  const totalQuestions = interactions.reduce((sum, i) => sum + i.questionsAsked, 0);
  const totalUpvotes = interactions.reduce((sum, i) => sum + i.upvotesGiven, 0);
  const participation = Math.min(100, (totalQuestions * 15) + (totalUpvotes * 3));

  const lastSeen = new Date(profile.lastSeen);
  const recency = recencyDecay(lastSeen) * 100;

  const dates = interactions.map(i => new Date(i.eventDate).getTime()).sort();
  let consistency = 0;
  if (dates.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, iv) => sum + Math.pow(iv - avgInterval, 2), 0) / intervals.length;
    const cv = Math.sqrt(variance) / Math.max(avgInterval, 1);
    consistency = Math.max(0, Math.min(100, (1 - cv) * 100));
  } else if (dates.length === 1) {
    consistency = 50;
  }

  const uniqueTopics = new Set(interactions.flatMap(i => i.questionTopics));
  const depth = Math.min(100, uniqueTopics.size * 12);

  return { attendance, participation, recency, consistency, depth };
}

function computeEngagementScore(components: EngagementComponents): number {
  return Math.round(
    (components.attendance * WEIGHTS.attendance) +
    (components.participation * WEIGHTS.participation) +
    (components.recency * WEIGHTS.recency) +
    (components.consistency * WEIGHTS.consistency) +
    (components.depth * WEIGHTS.depth)
  );
}

function classifyLifecycle(
  profile: InvestorProfile,
  score: number,
  previousLifecycle?: InvestorProfile["lifecycle"]
): InvestorProfile["lifecycle"] {
  const daysSinceLastSeen = (Date.now() - new Date(profile.lastSeen).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastSeen > 180) return "churned";
  if (daysSinceLastSeen > 90 && score < 30) return "at_risk";

  if (profile.totalEvents === 1 && daysSinceLastSeen < 30) return "new";

  const wasChurnedOrAtRisk = previousLifecycle === "churned" || previousLifecycle === "at_risk";
  if (wasChurnedOrAtRisk && daysSinceLastSeen < 30) return "reactivated";

  if (score >= 70 && profile.totalEvents >= 4) return "loyal";
  if (score >= 40) return "engaged";
  return "at_risk";
}

function computeChurnProbability(profile: InvestorProfile, components: EngagementComponents): number {
  const daysSinceLastSeen = (Date.now() - new Date(profile.lastSeen).getTime()) / (1000 * 60 * 60 * 24);

  let churn = 0;
  churn += Math.min(0.4, daysSinceLastSeen / 300);
  churn += (1 - components.recency / 100) * 0.25;
  churn += (1 - components.consistency / 100) * 0.15;
  churn += (1 - components.participation / 100) * 0.10;
  churn += (1 - components.attendance / 100) * 0.10;

  return Math.round(Math.min(1, Math.max(0, churn)) * 1000) / 1000;
}

function computeSentimentTrend(interactions: InvestorInteraction[]): InvestorProfile["sentimentTrend"] {
  if (interactions.length < 2) return "stable";

  const sorted = [...interactions].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const recent = sorted.slice(-3);
  const older = sorted.slice(0, -3).length > 0 ? sorted.slice(0, -3) : sorted.slice(0, 1);

  const recentAvg = recent.reduce((sum, i) => sum + i.sentimentScore, 0) / recent.length;
  const olderAvg = older.reduce((sum, i) => sum + i.sentimentScore, 0) / older.length;

  const delta = recentAvg - olderAvg;
  if (delta > 10) return "improving";
  if (delta < -10) return "declining";
  return "stable";
}

export class InvestorEngagementScoringService {
  static recordInteraction(input: {
    name: string;
    email?: string;
    company?: string;
    investorType?: InvestorProfile["investorType"];
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventType: string;
    questionsAsked: number;
    questionTopics: string[];
    sentimentScore: number;
    upvotesGiven: number;
    sessionDuration?: number;
  }): InvestorProfile {
    const investorId = generateInvestorId(input.name, input.email);

    let profile = profileStore.get(investorId);
    if (!profile) {
      profile = {
        investorId,
        name: input.name,
        email: input.email,
        company: input.company,
        investorType: input.investorType || "unknown",
        interactions: [],
        engagementScore: 0,
        lifecycle: "new",
        churnProbability: 0,
        topTopics: [],
        sentimentTrend: "stable",
        firstSeen: input.eventDate,
        lastSeen: input.eventDate,
        totalEvents: 0,
        totalQuestions: 0,
        avgSentiment: 50,
      };
    }

    const existingIdx = profile.interactions.findIndex(i => i.eventId === input.eventId);
    const interaction: InvestorInteraction = {
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      eventDate: input.eventDate,
      eventType: input.eventType,
      attended: true,
      questionsAsked: input.questionsAsked,
      questionTopics: input.questionTopics,
      sentimentScore: input.sentimentScore,
      upvotesGiven: input.upvotesGiven,
      sessionDuration: input.sessionDuration,
    };

    if (existingIdx >= 0) {
      profile.interactions[existingIdx] = interaction;
    } else {
      profile.interactions.push(interaction);
    }

    if (input.email) profile.email = input.email;
    if (input.company) profile.company = input.company;
    if (input.investorType && input.investorType !== "unknown") profile.investorType = input.investorType;

    profile.lastSeen = input.eventDate > profile.lastSeen ? input.eventDate : profile.lastSeen;
    profile.totalEvents = profile.interactions.length;
    profile.totalQuestions = profile.interactions.reduce((sum, i) => sum + i.questionsAsked, 0);
    profile.avgSentiment = Math.round(
      profile.interactions.reduce((sum, i) => sum + i.sentimentScore, 0) / profile.interactions.length
    );

    const allTopics = profile.interactions.flatMap(i => i.questionTopics);
    const topicCounts = new Map<string, number>();
    allTopics.forEach(t => topicCounts.set(t, (topicCounts.get(t) || 0) + 1));
    profile.topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    const components = computeEngagementComponents(profile);
    profile.engagementScore = computeEngagementScore(components);
    const previousLifecycle = profile.lifecycle;
    profile.lifecycle = classifyLifecycle(profile, profile.engagementScore, previousLifecycle);
    profile.churnProbability = computeChurnProbability(profile, components);
    profile.sentimentTrend = computeSentimentTrend(profile.interactions);

    profileStore.set(investorId, profile);
    return profile;
  }

  static getProfile(investorId: string): InvestorProfile | null {
    return profileStore.get(investorId) || null;
  }

  static getProfileByEmail(email: string): InvestorProfile | null {
    const id = generateInvestorId("", email);
    return profileStore.get(id) || null;
  }

  static listProfiles(filters?: {
    lifecycle?: InvestorProfile["lifecycle"];
    minScore?: number;
    maxScore?: number;
    investorType?: InvestorProfile["investorType"];
    sortBy?: "engagementScore" | "churnProbability" | "totalEvents" | "lastSeen";
    limit?: number;
  }): InvestorProfile[] {
    let profiles = [...profileStore.values()];

    if (filters?.lifecycle) {
      profiles = profiles.filter(p => p.lifecycle === filters.lifecycle);
    }
    if (filters?.minScore !== undefined) {
      profiles = profiles.filter(p => p.engagementScore >= filters.minScore!);
    }
    if (filters?.maxScore !== undefined) {
      profiles = profiles.filter(p => p.engagementScore <= filters.maxScore!);
    }
    if (filters?.investorType) {
      profiles = profiles.filter(p => p.investorType === filters.investorType);
    }

    const sortBy = filters?.sortBy || "engagementScore";
    profiles.sort((a, b) => {
      if (sortBy === "lastSeen") return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      if (sortBy === "churnProbability") return b.churnProbability - a.churnProbability;
      if (sortBy === "totalEvents") return b.totalEvents - a.totalEvents;
      return b.engagementScore - a.engagementScore;
    });

    return profiles.slice(0, filters?.limit || 100);
  }

  static getEngagementBreakdown(investorId: string): {
    components: EngagementComponents;
    score: number;
    lifecycle: string;
    churnProbability: number;
  } | null {
    const profile = profileStore.get(investorId);
    if (!profile) return null;

    const components = computeEngagementComponents(profile);
    return {
      components,
      score: profile.engagementScore,
      lifecycle: profile.lifecycle,
      churnProbability: profile.churnProbability,
    };
  }

  static getDashboardStats(): {
    totalInvestors: number;
    byLifecycle: Record<string, number>;
    byType: Record<string, number>;
    avgEngagement: number;
    atRiskCount: number;
    churnedCount: number;
    topEngaged: Array<{ investorId: string; name: string; company?: string; score: number }>;
    highChurnRisk: Array<{ investorId: string; name: string; company?: string; churnProbability: number }>;
  } {
    const profiles = [...profileStore.values()];

    const byLifecycle: Record<string, number> = {};
    const byType: Record<string, number> = {};
    profiles.forEach(p => {
      byLifecycle[p.lifecycle] = (byLifecycle[p.lifecycle] || 0) + 1;
      byType[p.investorType] = (byType[p.investorType] || 0) + 1;
    });

    return {
      totalInvestors: profiles.length,
      byLifecycle,
      byType,
      avgEngagement: profiles.length > 0
        ? Math.round(profiles.reduce((sum, p) => sum + p.engagementScore, 0) / profiles.length)
        : 0,
      atRiskCount: profiles.filter(p => p.lifecycle === "at_risk").length,
      churnedCount: profiles.filter(p => p.lifecycle === "churned").length,
      topEngaged: profiles
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 10)
        .map(p => ({ investorId: p.investorId, name: p.name, company: p.company, score: p.engagementScore })),
      highChurnRisk: profiles
        .filter(p => p.churnProbability > 0.5)
        .sort((a, b) => b.churnProbability - a.churnProbability)
        .slice(0, 10)
        .map(p => ({ investorId: p.investorId, name: p.name, company: p.company, churnProbability: p.churnProbability })),
    };
  }

  static async generateRelationshipInsight(investorId: string): Promise<{
    summary: string;
    recommendations: string[];
    riskFactors: string[];
    opportunities: string[];
    suggestedOutreach: string;
    nextBestAction: string;
  }> {
    const profile = profileStore.get(investorId);
    if (!profile) throw new Error("Investor profile not found");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert investor relations advisor. Analyze this investor's engagement history and provide actionable relationship intelligence.

Return JSON with:
- summary: 2-3 sentence overview of this investor's engagement pattern
- recommendations: array of 3-5 specific actions to improve the relationship
- riskFactors: array of 2-3 risks to the relationship
- opportunities: array of 2-3 opportunities to deepen engagement
- suggestedOutreach: specific outreach message or approach to use
- nextBestAction: the single most impactful next step`
        },
        {
          role: "user",
          content: `Analyze this investor relationship:

NAME: ${profile.name}
COMPANY: ${profile.company || "Unknown"}
TYPE: ${profile.investorType}
LIFECYCLE: ${profile.lifecycle}
ENGAGEMENT SCORE: ${profile.engagementScore}/100
CHURN PROBABILITY: ${(profile.churnProbability * 100).toFixed(1)}%
SENTIMENT TREND: ${profile.sentimentTrend}
TOTAL EVENTS: ${profile.totalEvents}
TOTAL QUESTIONS: ${profile.totalQuestions}
TOP TOPICS: ${profile.topTopics.join(", ") || "None"}
FIRST SEEN: ${profile.firstSeen}
LAST SEEN: ${profile.lastSeen}

RECENT INTERACTIONS:
${profile.interactions.slice(-5).map(i =>
  `- ${i.eventDate}: ${i.eventTitle} (${i.eventType}) — ${i.questionsAsked} questions, sentiment: ${i.sentimentScore}`
).join("\n")}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "relationship_insight",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              recommendations: { type: "array", items: { type: "string" } },
              riskFactors: { type: "array", items: { type: "string" } },
              opportunities: { type: "array", items: { type: "string" } },
              suggestedOutreach: { type: "string" },
              nextBestAction: { type: "string" },
            },
            required: ["summary", "recommendations", "riskFactors", "opportunities", "suggestedOutreach", "nextBestAction"],
            additionalProperties: false,
          }
        }
      }
    });

    const text = response?.choices?.[0]?.message?.content || "{}";
    return JSON.parse(text);
  }

  static async generateCohortAnalysis(eventId: string): Promise<{
    totalAttendees: number;
    newInvestors: number;
    returningInvestors: number;
    avgEngagementScore: number;
    topParticipants: Array<{ name: string; company?: string; questionsAsked: number; score: number }>;
    engagementDistribution: Record<string, number>;
    retentionRate: number;
    insights: string[];
  }> {
    const profiles = [...profileStore.values()].filter(p =>
      p.interactions.some(i => i.eventId === eventId)
    );

    const newInvestors = profiles.filter(p => p.totalEvents === 1).length;
    const returningInvestors = profiles.length - newInvestors;

    const eventInteractions = profiles.map(p => ({
      ...p,
      interaction: p.interactions.find(i => i.eventId === eventId)!,
    }));

    const distribution: Record<string, number> = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    profiles.forEach(p => {
      if (p.engagementScore <= 20) distribution["0-20"]++;
      else if (p.engagementScore <= 40) distribution["21-40"]++;
      else if (p.engagementScore <= 60) distribution["41-60"]++;
      else if (p.engagementScore <= 80) distribution["61-80"]++;
      else distribution["81-100"]++;
    });

    const retentionRate = profiles.length > 0
      ? Math.round((returningInvestors / profiles.length) * 100)
      : 0;

    const insights: string[] = [];
    if (retentionRate > 60) insights.push("Strong investor retention — majority are returning attendees");
    if (retentionRate < 30) insights.push("Low retention — consider targeted re-engagement campaigns");
    if (newInvestors > returningInvestors) insights.push("High new investor ratio — effective awareness/outreach");
    const avgScore = profiles.length > 0
      ? Math.round(profiles.reduce((sum, p) => sum + p.engagementScore, 0) / profiles.length) : 0;
    if (avgScore > 70) insights.push("Highly engaged audience — consider premium IR touchpoints");

    return {
      totalAttendees: profiles.length,
      newInvestors,
      returningInvestors,
      avgEngagementScore: avgScore,
      topParticipants: eventInteractions
        .sort((a, b) => b.interaction.questionsAsked - a.interaction.questionsAsked)
        .slice(0, 10)
        .map(p => ({
          name: p.name,
          company: p.company,
          questionsAsked: p.interaction.questionsAsked,
          score: p.engagementScore,
        })),
      engagementDistribution: distribution,
      retentionRate,
      insights,
    };
  }
}
