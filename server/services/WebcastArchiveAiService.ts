import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";

type WebcastSegment = { speaker: string; text: string; timestamp: number };

type WebcastSession = {
  sessionId: number;
  clientName: string;
  eventTitle: string;
  eventType: string;
  eventDate?: string;
};

export async function createWebcastSession(
  userId: number,
  opts: {
    clientName: string;
    eventTitle: string;
    eventType: string;
    eventDate?: string;
  }
): Promise<WebcastSession> {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  const [result] = await conn.execute(
    `INSERT INTO webcast_archive_sessions (user_id, client_name, event_title, event_type, event_date, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [userId, opts.clientName, opts.eventTitle, opts.eventType, opts.eventDate ?? null]
  );

  return {
    sessionId: (result as any).insertId,
    clientName: opts.clientName,
    eventTitle: opts.eventTitle,
    eventType: opts.eventType,
    eventDate: opts.eventDate,
  };
}

export async function analyzePresentationEffectiveness(
  userId: number,
  sessionId: number,
  segments: WebcastSegment[]
): Promise<any> {
  const transcript = segments.map(s => `[${s.speaker}]: ${s.text}`).join("\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a corporate communications expert analyzing a webcast presentation. Evaluate the presentation effectiveness and produce a JSON report with this structure:
{
  "overallScore": <0-100>,
  "messageClarity": <0-100>,
  "audienceAlignment": <0-100>,
  "narrativeFlow": <0-100>,
  "dataPresentation": <0-100>,
  "keyMessages": [{ "message": "string", "effectiveness": "Strong|Moderate|Weak", "recommendation": "string" }],
  "strengthAreas": ["string"],
  "improvementAreas": ["string"],
  "executiveSummary": "2-3 sentence summary of presentation quality",
  "benchmarkComparison": "How this compares to best-practice corporate webcasts"
}
Return ONLY valid JSON.`,
      },
      { role: "user", content: `Analyze this webcast transcript for presentation effectiveness:\n\n${transcript.slice(0, 15000)}` },
    ],
    model: "gpt-4o",
  });

  const raw = (response.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const result = JSON.parse(cleaned);

  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;
  await conn.execute(
    `INSERT INTO webcast_archive_results (session_id, algorithm_name, result_data) VALUES (?, 'presentation_effectiveness', ?)`,
    [sessionId, JSON.stringify(result)]
  );

  return result;
}

export async function extractKeyMessages(
  userId: number,
  sessionId: number,
  segments: WebcastSegment[]
): Promise<any> {
  const transcript = segments.map(s => `[${s.speaker}]: ${s.text}`).join("\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an investor relations analyst extracting key messages from a corporate webcast. Produce a JSON report:
{
  "primaryMessages": [{ "message": "string", "speaker": "string", "significance": "High|Medium|Low", "category": "Strategic|Financial|Operational|ESG|Risk" }],
  "financialHighlights": [{ "metric": "string", "value": "string", "context": "string", "trend": "Improving|Stable|Declining" }],
  "guidanceStatements": [{ "statement": "string", "speaker": "string", "timeframe": "string", "confidence": "High|Medium|Low" }],
  "strategicInitiatives": [{ "initiative": "string", "status": "Announced|In Progress|Completed", "impact": "string" }],
  "riskDisclosures": [{ "risk": "string", "mitigation": "string", "severity": "High|Medium|Low" }],
  "quotableExcerpts": [{ "quote": "string", "speaker": "string", "context": "string", "usability": "Press Release|Social Media|Internal" }],
  "messageConsistencyScore": <0-100>,
  "narrativeStrength": "string"
}
Return ONLY valid JSON.`,
      },
      { role: "user", content: `Extract key messages from this webcast:\n\n${transcript.slice(0, 15000)}` },
    ],
    model: "gpt-4o",
  });

  const raw = (response.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const result = JSON.parse(cleaned);

  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;
  await conn.execute(
    `INSERT INTO webcast_archive_results (session_id, algorithm_name, result_data) VALUES (?, 'key_messages', ?)`,
    [sessionId, JSON.stringify(result)]
  );

  return result;
}

export async function analyzeSpeakerPerformance(
  userId: number,
  sessionId: number,
  segments: WebcastSegment[]
): Promise<any> {
  const transcript = segments.map(s => `[${s.speaker}]: ${s.text}`).join("\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a presentation coach analyzing speaker performance in a corporate webcast. Produce a JSON report:
{
  "speakers": [{
    "name": "string",
    "role": "string",
    "overallScore": <0-100>,
    "clarity": <0-100>,
    "confidence": <0-100>,
    "engagement": <0-100>,
    "technicalAccuracy": <0-100>,
    "wordCount": <number>,
    "speakingTimePercent": <0-100>,
    "strengths": ["string"],
    "coachingTips": ["string"],
    "notableQuotes": ["string"]
  }],
  "speakerDynamics": "Analysis of how speakers interacted and transitioned",
  "bestPerformer": "string",
  "overallTeamScore": <0-100>,
  "recommendedTraining": ["string"]
}
Return ONLY valid JSON.`,
      },
      { role: "user", content: `Analyze speaker performance in this webcast:\n\n${transcript.slice(0, 15000)}` },
    ],
    model: "gpt-4o",
  });

  const raw = (response.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const result = JSON.parse(cleaned);

  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;
  await conn.execute(
    `INSERT INTO webcast_archive_results (session_id, algorithm_name, result_data) VALUES (?, 'speaker_performance', ?)`,
    [sessionId, JSON.stringify(result)]
  );

  return result;
}

export async function generateWebcastContentPack(
  userId: number,
  sessionId: number,
  segments: WebcastSegment[],
  clientName: string,
  eventName: string
): Promise<any> {
  const transcript = segments.map(s => `[${s.speaker}]: ${s.text}`).join("\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a corporate communications specialist generating post-webcast content. The client is "${clientName}" and the event is "${eventName}". Produce a JSON report:
{
  "pressRelease": "A 3-4 paragraph press release summarizing key announcements",
  "socialMediaPosts": [
    { "platform": "LinkedIn", "content": "string", "hashtags": ["string"] },
    { "platform": "Twitter/X", "content": "string (max 280 chars)", "hashtags": ["string"] }
  ],
  "investorNewsletter": "2-3 paragraph newsletter excerpt for investor distribution",
  "internalBrief": "Executive briefing for internal distribution",
  "podcastScript": "3-4 paragraph podcast-style recap script",
  "keyTakeaways": ["string"],
  "followUpActions": [{ "action": "string", "owner": "string", "priority": "High|Medium|Low" }],
  "mediaContactAngles": [{ "angle": "string", "targetMedia": "string", "keyQuote": "string" }]
}
Return ONLY valid JSON. All content must exclude forward-looking statements and comply with regulatory disclosure rules.`,
      },
      { role: "user", content: `Generate post-event content pack from this webcast:\n\n${transcript.slice(0, 15000)}` },
    ],
    model: "gpt-4o",
  });

  const raw = (response.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const result = JSON.parse(cleaned);

  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;
  await conn.execute(
    `INSERT INTO webcast_archive_results (session_id, algorithm_name, result_data) VALUES (?, 'content_pack', ?)`,
    [sessionId, JSON.stringify(result)]
  );

  return result;
}

export async function analyzeAudienceEngagement(
  userId: number,
  sessionId: number,
  segments: WebcastSegment[]
): Promise<any> {
  const transcript = segments.map(s => `[${s.speaker}]: ${s.text}`).join("\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an event analytics expert analyzing a webcast for audience engagement signals. From the transcript, identify engagement indicators and Q&A quality. Produce a JSON report:
{
  "engagementScore": <0-100>,
  "qaAnalysis": {
    "totalQuestions": <number>,
    "questionQuality": "Excellent|Good|Average|Poor",
    "themes": [{ "theme": "string", "questionCount": <number>, "sentiment": "Positive|Neutral|Negative" }],
    "unansweredConcerns": ["string"],
    "audienceEngagement": "High|Moderate|Low"
  },
  "contentEngagementPeaks": [{ "topic": "string", "engagementLevel": "High|Medium|Low", "reason": "string" }],
  "dropOffRiskPoints": [{ "point": "string", "reason": "string", "recommendation": "string" }],
  "interactivityScore": <0-100>,
  "recommendationsForNextEvent": ["string"],
  "audienceProfile": "Assessment of likely audience composition based on question patterns"
}
Return ONLY valid JSON.`,
      },
      { role: "user", content: `Analyze audience engagement from this webcast:\n\n${transcript.slice(0, 15000)}` },
    ],
    model: "gpt-4o",
  });

  const raw = (response.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const result = JSON.parse(cleaned);

  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;
  await conn.execute(
    `INSERT INTO webcast_archive_results (session_id, algorithm_name, result_data) VALUES (?, 'audience_engagement', ?)`,
    [sessionId, JSON.stringify(result)]
  );

  return result;
}

export async function generateWebcastReport(
  userId: number,
  sessionId: number
): Promise<any> {
  const db = await getDb();
  const conn = (db as any).session?.client ?? (db as any).$client;

  const [rows] = await conn.execute(
    `SELECT algorithm_name, result_data FROM webcast_archive_results WHERE session_id = ?`,
    [sessionId]
  );

  const allResults: Record<string, any> = {};
  for (const row of rows as any[]) {
    try {
      allResults[row.algorithm_name] = typeof row.result_data === "string" ? JSON.parse(row.result_data) : row.result_data;
    } catch {
      allResults[row.algorithm_name] = row.result_data;
    }
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a senior IR consultant. Based on the webcast analysis results, produce a comprehensive executive report in JSON:
{
  "overallVerdict": "Excellent|Good|Satisfactory|Needs Improvement|Poor",
  "overallScore": <0-100>,
  "executiveSummary": "3-5 sentence executive summary",
  "topStrengths": ["string"],
  "topRisks": ["string"],
  "immediateActions": [{ "action": "string", "priority": "Critical|High|Medium", "owner": "string" }],
  "nextEventRecommendations": ["string"],
  "complianceNotes": ["string"],
  "investorSentimentAssessment": "string",
  "mediaReadiness": "Ready|Partially Ready|Not Ready",
  "reportDate": "${new Date().toISOString().split("T")[0]}"
}
Return ONLY valid JSON.`,
      },
      { role: "user", content: `Generate the executive report from these webcast analysis results:\n\n${JSON.stringify(allResults, null, 2).slice(0, 15000)}` },
    ],
    model: "gpt-4o",
  });

  const raw = (response.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const result = JSON.parse(cleaned);

  await conn.execute(
    `INSERT INTO webcast_archive_results (session_id, algorithm_name, result_data) VALUES (?, 'executive_report', ?)`,
    [sessionId, JSON.stringify(result)]
  );

  await conn.execute(
    `UPDATE webcast_archive_sessions SET status = 'completed' WHERE id = ?`,
    [sessionId]
  );

  return result;
}
