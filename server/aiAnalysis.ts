/**
 * aiAnalysis.ts — Real-time AI analysis helpers for the CuraLive platform.
 *
 * Used by the Recall webhook pipeline and tRPC procedures to provide:
 *   1. Live sentiment scoring from transcript segments
 *   2. Rolling AI summary (every N segments)
 *   3. Q&A auto-triage (approve / duplicate / off-topic / sensitive)
 *   4. Toxicity / compliance filter for price-sensitive content
 *   5. Event brief generation from press release text
 *   6. AI press release draft from post-event transcript
 *   7. Enhanced post-event summary with financial highlights
 */

import { invokeLLM } from "./_core/llm";

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Safely extract a string from an LLM response content field (may be string or content-part array) */
function extractContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;
  return content.map((p) => (p.type === "text" ? (p.text ?? "") : "")).join("");
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SentimentResult {
  score: number;          // 0–100
  label: "Positive" | "Neutral" | "Cautious" | "Negative";
  keywords: string[];     // top 3 sentiment-driving keywords
  timestamp: number;
}

export interface RollingSummary {
  text: string;           // 2–3 sentence "what you missed" summary
  timestamp: number;
  segmentCount: number;
}

export interface QATriage {
  classification: "approved" | "duplicate" | "off-topic" | "sensitive" | "compliance";
  confidence: number;     // 0–100
  reason: string;         // brief explanation
}

export interface EventBrief {
  headline: string;
  keyMessages: string[];  // 3–5 bullet points
  talkingPoints: string[];// 5–7 talking points for the presenter
  anticipatedQuestions: string[]; // 3–5 likely analyst questions
  disclaimer: string;
}

export interface PressReleaseDraft {
  headline: string;
  subheadline: string;
  body: string;           // full SENS/RNS-style press release body
  boilerplate: string;
}

export interface EnhancedSummary {
  executiveSummary: string;
  financialHighlights: string[];
  forwardLookingStatements: string[];
  riskFactors: string[];
  keyTopics: string[];
  actionItems: string[];
  sentiment: "Positive" | "Neutral" | "Cautious" | "Negative";
  sentimentScore: number;
}

// ─── 1. Live Sentiment Scoring ────────────────────────────────────────────────

/**
 * Scores the sentiment of the most recent transcript text.
 * Called every SENTIMENT_INTERVAL segments in the webhook handler.
 * Returns a score (0–100) and label.
 */
export async function scoreSentiment(
  recentText: string
): Promise<SentimentResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a financial communications sentiment analyser. " +
            "Analyse the tone of the provided transcript excerpt from an investor event. " +
            "Return JSON only.",
        },
        {
          role: "user",
          content: `Analyse the sentiment of this transcript excerpt:\n\n"${recentText.slice(0, 1500)}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: {
                type: "integer",
                description: "Sentiment score from 0 (very negative) to 100 (very positive)",
              },
              label: {
                type: "string",
                enum: ["Positive", "Neutral", "Cautious", "Negative"],
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "Top 3 words driving the sentiment",
              },
            },
            required: ["score", "label", "keywords"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty LLM response");
    const parsed = JSON.parse(extractContent(raw));
    return { ...parsed, timestamp: Date.now() };
  } catch (err) {
    console.warn("[AI] Sentiment scoring failed, using fallback:", err);
    return { score: 65, label: "Neutral", keywords: [], timestamp: Date.now() };
  }
}

// ─── 2. Rolling AI Summary ────────────────────────────────────────────────────

/**
 * Generates a 2–3 sentence "what you missed" rolling summary from recent transcript segments.
 */
export async function generateRollingSummary(
  segments: Array<{ speaker: string; text: string }>,
  eventTitle: string
): Promise<RollingSummary> {
  const context = segments
    .slice(-20) // last 20 segments
    .map((s) => `${s.speaker}: ${s.text}`)
    .join("\n");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a live event summariser for investor webcasts. " +
            "Write a concise 2–3 sentence summary of what has been discussed so far. " +
            "Use present tense. Be factual and professional. Return plain text only.",
        },
        {
          role: "user",
          content: `Event: ${eventTitle}\n\nRecent transcript:\n${context}\n\nWrite a brief rolling summary:`,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content;
    const text = raw
      ? extractContent(raw).trim()
      : "The event is in progress. Transcript is being captured.";

    return { text, timestamp: Date.now(), segmentCount: segments.length };
  } catch (err) {
    console.warn("[AI] Rolling summary failed:", err);
    return {
      text: "The event is in progress. Transcript is being captured.",
      timestamp: Date.now(),
      segmentCount: segments.length,
    };
  }
}

// ─── 3. Q&A Auto-Triage ───────────────────────────────────────────────────────

/**
 * Classifies a submitted Q&A question for the moderator.
 * Returns: approved | duplicate | off-topic | sensitive | compliance
 */
export async function triageQuestion(
  question: string,
  existingQuestions: string[]
): Promise<QATriage> {
  const existingContext =
    existingQuestions.length > 0
      ? `Existing questions already in queue:\n${existingQuestions.slice(-10).map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      : "No existing questions yet.";

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a Q&A moderator for investor webcasts and earnings calls. " +
            "Classify the submitted question. Return JSON only.",
        },
        {
          role: "user",
          content: `New question: "${question}"\n\n${existingContext}\n\nClassify this question.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "qa_triage",
          strict: true,
          schema: {
            type: "object",
            properties: {
              classification: {
                type: "string",
                enum: ["approved", "duplicate", "off-topic", "sensitive", "compliance"],
                description:
                  "approved=good question; duplicate=similar to existing; off-topic=not relevant; sensitive=market-moving info; compliance=potentially abusive/inappropriate",
              },
              confidence: {
                type: "integer",
                description: "Confidence 0–100",
              },
              reason: {
                type: "string",
                description: "One sentence explanation",
              },
            },
            required: ["classification", "confidence", "reason"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty LLM response");
    return JSON.parse(extractContent(raw));
  } catch (err) {
    console.warn("[AI] Q&A triage failed:", err);
    return { classification: "approved", confidence: 50, reason: "Auto-triage unavailable" };
  }
}

// ─── 4. AI Event Brief Generator ─────────────────────────────────────────────

/** Fallback brief built from the press release text when no LLM key is configured. */
function buildFallbackBrief(pressRelease: string, eventTitle: string, companyName: string): EventBrief {
  const sentences = pressRelease.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const headline = sentences[0]?.replace(/^.{0,40}\s/, s => s) ?? `${companyName} — ${eventTitle}`;

  const FINANCIAL_TERMS = /revenue|growth|profit|margin|earnings|EPS|EBITDA|forecast|outlook|guidance|acquisition|dividend|dividend|strategy|expand|launch|partner|deal|agreement/i;
  const keyMessages = sentences
    .filter(s => FINANCIAL_TERMS.test(s) && s.length > 30 && s.length < 200)
    .slice(0, 4)
    .map(s => s.length > 150 ? s.slice(0, 150) + "…" : s);

  if (keyMessages.length === 0) {
    keyMessages.push(...sentences.slice(1, 4).map(s => s.length > 150 ? s.slice(0, 150) + "…" : s));
  }

  const co = companyName || "the company";
  const ev = eventTitle || "this event";

  const talkingPoints = [
    `Welcome to ${ev} — today we will outline our strategic priorities and financial performance.`,
    `${co} remains committed to delivering sustainable shareholder value through disciplined capital allocation.`,
    `Our balance sheet remains robust and we are well-positioned to navigate current market conditions.`,
    `We continue to execute on our strategic roadmap with clear milestones and measurable outcomes.`,
    `Management is available for questions following the prepared remarks and will be transparent about risks and opportunities.`,
  ];

  const anticipatedQuestions = [
    `Can management provide more colour on the near-term revenue outlook and key drivers of growth?`,
    `How is ${co} thinking about capital allocation — specifically dividends versus share buybacks versus M&A?`,
    `What are the biggest macro or sector risks management is monitoring, and how is the business positioned against them?`,
  ];

  return {
    headline: headline.length > 200 ? headline.slice(0, 200) + "…" : headline,
    keyMessages,
    talkingPoints,
    anticipatedQuestions,
    disclaimer: "This document contains forward-looking statements that involve risks and uncertainties. Actual results may differ materially from those projected. Past performance is not a guarantee of future results.",
  };
}

/**
 * Generates an event brief and talking points from a press release or event description.
 */
export async function generateEventBrief(
  pressRelease: string,
  eventTitle: string,
  companyName: string
): Promise<EventBrief> {
  if (!process.env.BUILT_IN_FORGE_API_KEY && !process.env.OPENAI_API_KEY) {
    return buildFallbackBrief(pressRelease, eventTitle, companyName);
  }

  try {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an investor relations communications expert. " +
          "Generate a concise event brief and presenter talking points from the provided press release. " +
          "Return JSON only.",
      },
      {
        role: "user",
        content: `Company: ${companyName}\nEvent: ${eventTitle}\n\nPress Release:\n${pressRelease.slice(0, 3000)}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "event_brief",
        strict: true,
        schema: {
          type: "object",
          properties: {
            headline: { type: "string", description: "One-line event headline" },
            keyMessages: {
              type: "array",
              items: { type: "string" },
              description: "3–5 key messages from the press release",
            },
            talkingPoints: {
              type: "array",
              items: { type: "string" },
              description: "5–7 presenter talking points",
            },
            anticipatedQuestions: {
              type: "array",
              items: { type: "string" },
              description: "3–5 likely analyst questions",
            },
            disclaimer: {
              type: "string",
              description: "Standard forward-looking statements disclaimer",
            },
          },
          required: ["headline", "keyMessages", "talkingPoints", "anticipatedQuestions", "disclaimer"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = response.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty LLM response for event brief");
  return JSON.parse(extractContent(raw));
  } catch (err) {
    console.warn("[generateEventBrief] LLM failed, using fallback:", err instanceof Error ? err.message : err);
    return buildFallbackBrief(pressRelease, eventTitle, companyName);
  }
}

// ─── 5. AI Press Release Draft ────────────────────────────────────────────────

/**
 * Generates a SENS/RNS-style press release from the post-event transcript.
 */
export async function generatePressRelease(
  transcript: Array<{ speaker: string; text: string }>,
  eventTitle: string,
  companyName: string,
  eventDate: string
): Promise<PressReleaseDraft> {
  const transcriptText = transcript
    .map((s) => `${s.speaker}: ${s.text}`)
    .join("\n")
    .slice(0, 4000);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an investor relations writer specialising in JSE SENS and LSE RNS announcements. " +
          "Draft a professional press release from the provided event transcript. " +
          "Use formal financial language. Return JSON only.",
      },
      {
        role: "user",
        content: `Company: ${companyName}\nEvent: ${eventTitle}\nDate: ${eventDate}\n\nTranscript:\n${transcriptText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "press_release",
        strict: true,
        schema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            subheadline: { type: "string" },
            body: {
              type: "string",
              description: "Full press release body (4–6 paragraphs, formal tone)",
            },
            boilerplate: {
              type: "string",
              description: "Standard company boilerplate paragraph",
            },
          },
          required: ["headline", "subheadline", "body", "boilerplate"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = response.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty LLM response for press release");
  return JSON.parse(extractContent(raw));
}

// ─── 6. Enhanced Post-Event Summary ──────────────────────────────────────────

/**
 * Generates a comprehensive post-event summary with financial highlights,
 * forward-looking statements, risk factors, and sentiment scoring.
 */
export async function generateEnhancedSummary(
  transcript: Array<{ speaker: string; text: string }>,
  eventTitle: string,
  qaItems: Array<{ question: string; answer?: string }>
): Promise<EnhancedSummary> {
  const transcriptText = transcript
    .map((s) => `${s.speaker}: ${s.text}`)
    .join("\n")
    .slice(0, 4000);

  const qaText = qaItems
    .slice(0, 10)
    .map((q) => `Q: ${q.question}${q.answer ? `\nA: ${q.answer}` : ""}`)
    .join("\n\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a senior financial analyst specialising in investor event analysis. " +
          "Produce a comprehensive post-event summary for an institutional investor audience. " +
          "Return JSON only.",
      },
      {
        role: "user",
        content: `Event: ${eventTitle}\n\nTranscript:\n${transcriptText}\n\nQ&A:\n${qaText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "enhanced_summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            executiveSummary: {
              type: "string",
              description: "2–3 paragraph executive summary",
            },
            financialHighlights: {
              type: "array",
              items: { type: "string" },
              description: "Key financial figures and metrics mentioned",
            },
            forwardLookingStatements: {
              type: "array",
              items: { type: "string" },
              description: "Guidance and forward-looking statements",
            },
            riskFactors: {
              type: "array",
              items: { type: "string" },
              description: "Risk factors and cautionary statements mentioned",
            },
            keyTopics: {
              type: "array",
              items: { type: "string" },
              description: "Top 6 topics discussed",
            },
            actionItems: {
              type: "array",
              items: { type: "string" },
              description: "Follow-up action items or commitments made",
            },
            sentiment: {
              type: "string",
              enum: ["Positive", "Neutral", "Cautious", "Negative"],
            },
            sentimentScore: {
              type: "integer",
              description: "Overall sentiment score 0–100",
            },
          },
          required: [
            "executiveSummary",
            "financialHighlights",
            "forwardLookingStatements",
            "riskFactors",
            "keyTopics",
            "actionItems",
            "sentiment",
            "sentimentScore",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = response.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty LLM response for enhanced summary");
  return JSON.parse(extractContent(raw));
}

// ─── 7. LLM Translation ───────────────────────────────────────────────────────

/**
 * Translates a transcript segment to the target language.
 * Used by the multi-language selector in the Attendee Event Room.
 */
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  if (targetLanguage === "en") return text;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. Return only the translated text, no explanations.`,
        },
        { role: "user", content: text },
      ],
    });

    const raw = response.choices?.[0]?.message?.content;
    return raw ? extractContent(raw).trim() : text;
  } catch {
    return text; // fallback to original on error
  }
}

// ─── 8. Speaking-Pace Coach ───────────────────────────────────────────────────

export interface SpeakerPaceAnalysis {
  speaker: string;
  wordCount: number;
  durationSeconds: number;
  wpm: number;                          // words per minute
  paceLabel: "Too Fast" | "Optimal" | "Too Slow";
  pauseScore: number;                   // 0–100 (higher = better pause usage)
  fillerWordCount: number;
  fillerWords: string[];                // detected filler words
  coachingTips: string[];               // 2–4 actionable tips
  overallScore: number;                 // 0–100
}

export interface PaceCoachReport {
  speakers: SpeakerPaceAnalysis[];
  overallEventPace: "Fast-Paced" | "Well-Paced" | "Slow-Paced";
  summary: string;
}

/**
 * Analyses speaking pace and delivery quality per speaker.
 * Uses word-count heuristics + LLM coaching tips.
 */
export async function analyzeSpeakingPace(
  transcript: Array<{ speaker: string; text: string; timeLabel?: string }>
): Promise<PaceCoachReport> {
  // Group segments by speaker
  const bySpeaker: Record<string, string[]> = {};
  for (const seg of transcript) {
    if (!bySpeaker[seg.speaker]) bySpeaker[seg.speaker] = [];
    bySpeaker[seg.speaker].push(seg.text);
  }

  // Estimate duration: assume ~30 s per segment on average
  const segCountBySpeaker: Record<string, number> = {};
  for (const seg of transcript) {
    segCountBySpeaker[seg.speaker] = (segCountBySpeaker[seg.speaker] ?? 0) + 1;
  }

  const FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "actually", "right", "so", "well"];

  const speakerAnalyses: SpeakerPaceAnalysis[] = [];

  for (const [speaker, texts] of Object.entries(bySpeaker)) {
    const fullText = texts.join(" ");
    const words = fullText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const durationSeconds = (segCountBySpeaker[speaker] ?? 1) * 30;
    const wpm = Math.round((wordCount / durationSeconds) * 60);

    const paceLabel: SpeakerPaceAnalysis["paceLabel"] =
      wpm > 180 ? "Too Fast" : wpm < 110 ? "Too Slow" : "Optimal";

    // Filler word detection
    const lowerText = fullText.toLowerCase();
    const detectedFillers = FILLER_WORDS.filter((fw) => lowerText.includes(fw));
    const fillerWordCount = detectedFillers.reduce((count, fw) => {
      const re = new RegExp(`\\b${fw}\\b`, "gi");
      return count + (fullText.match(re)?.length ?? 0);
    }, 0);

    // Pause score heuristic: punctuation density
    const punctCount = (fullText.match(/[,;:.!?]/g) ?? []).length;
    const pauseScore = Math.min(100, Math.round((punctCount / Math.max(wordCount, 1)) * 500));

    // LLM coaching tips
    let coachingTips: string[] = [];
    let overallScore = 75;
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a professional speaking coach for investor relations and corporate communications. " +
              "Provide concise, actionable coaching tips. Return JSON only.",
          },
          {
            role: "user",
            content: `Speaker: ${speaker}\nWords per minute: ${wpm} (${paceLabel})\nFiller words detected: ${detectedFillers.join(", ") || "none"}\nFiller count: ${fillerWordCount}\nPause score: ${pauseScore}/100\n\nSample text:\n"${fullText.slice(0, 600)}"\n\nProvide 3 actionable coaching tips and an overall delivery score.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "pace_coach",
            strict: true,
            schema: {
              type: "object",
              properties: {
                coachingTips: {
                  type: "array",
                  items: { type: "string" },
                  description: "3 concise actionable coaching tips",
                },
                overallScore: {
                  type: "integer",
                  description: "Overall delivery score 0–100",
                },
              },
              required: ["coachingTips", "overallScore"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response.choices?.[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(extractContent(raw));
        coachingTips = parsed.coachingTips ?? [];
        overallScore = parsed.overallScore ?? 75;
      }
    } catch {
      // fallback tips
      coachingTips = [
        paceLabel === "Too Fast" ? "Slow down slightly — aim for 140–160 WPM for investor calls." : paceLabel === "Too Slow" ? "Pick up the pace to maintain audience engagement." : "Your pace is well-calibrated for investor calls.",
        fillerWordCount > 3 ? `Reduce filler words (detected: ${detectedFillers.slice(0, 3).join(", ")}).` : "Good control of filler words.",
        pauseScore < 40 ? "Use more deliberate pauses after key financial figures." : "Good use of pauses to emphasise key points.",
      ];
    }

    speakerAnalyses.push({
      speaker,
      wordCount,
      durationSeconds,
      wpm,
      paceLabel,
      pauseScore,
      fillerWordCount,
      fillerWords: detectedFillers,
      coachingTips,
      overallScore,
    });
  }

  // Overall event pace
  const avgWpm = speakerAnalyses.reduce((s, a) => s + a.wpm, 0) / Math.max(speakerAnalyses.length, 1);
  const overallEventPace: PaceCoachReport["overallEventPace"] =
    avgWpm > 175 ? "Fast-Paced" : avgWpm < 115 ? "Slow-Paced" : "Well-Paced";

  const summary = `The event averaged ${Math.round(avgWpm)} WPM across ${speakerAnalyses.length} speaker${speakerAnalyses.length !== 1 ? "s" : ""}. Overall delivery was ${overallEventPace.toLowerCase()}.`;

  return { speakers: speakerAnalyses, overallEventPace, summary };
}
