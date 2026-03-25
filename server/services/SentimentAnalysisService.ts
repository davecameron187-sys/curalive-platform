// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { occTranscriptionSegments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Sentiment Analysis Service
 * Analyzes speaker sentiment and emotion from transcription segments
 * Uses OpenAI GPT-4 for accurate emotion detection
 */

export interface SentimentScore {
  segmentId: number;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  emotion: "happy" | "sad" | "angry" | "surprised" | "fearful" | "disgusted" | "neutral";
  emotionScore: number;
  keyPhrases: string[];
  tone: "professional" | "casual" | "formal" | "aggressive" | "supportive";
}

export interface SentimentBatch {
  conferenceId: number;
  segments: SentimentScore[];
  overallSentiment: "positive" | "neutral" | "negative";
  averageConfidence: number;
  emotionDistribution: Record<string, number>;
}

/**
 * Analyze sentiment of a single transcription segment
 */
export async function analyzeSentiment(text: string): Promise<Omit<SentimentScore, "segmentId">> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert sentiment and emotion analysis system. Analyze the given text and return a JSON object with:
- sentiment: "positive", "neutral", or "negative"
- confidence: 0-100 confidence score
- emotion: one of "happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"
- emotionScore: 0-100 intensity of the emotion
- keyPhrases: array of 2-3 key phrases that indicate the sentiment
- tone: "professional", "casual", "formal", "aggressive", or "supportive"

Return ONLY valid JSON, no markdown or extra text.`,
        },
        {
          role: "user",
          content: `Analyze this text: "${text}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentiment: {
                type: "string",
                enum: ["positive", "neutral", "negative"],
              },
              confidence: {
                type: "number",
                description: "Confidence score 0-100",
              },
              emotion: {
                type: "string",
                enum: ["happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"],
              },
              emotionScore: {
                type: "number",
                description: "Emotion intensity 0-100",
              },
              keyPhrases: {
                type: "array",
                items: { type: "string" },
                description: "Key phrases indicating sentiment",
              },
              tone: {
                type: "string",
                enum: ["professional", "casual", "formal", "aggressive", "supportive"],
              },
            },
            required: ["sentiment", "confidence", "emotion", "emotionScore", "keyPhrases", "tone"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);

    return {
      text,
      sentiment: parsed.sentiment,
      confidence: Math.min(100, Math.max(0, parsed.confidence)),
      emotion: parsed.emotion,
      emotionScore: Math.min(100, Math.max(0, parsed.emotionScore)),
      keyPhrases: parsed.keyPhrases || [],
      tone: parsed.tone,
    };
  } catch (error) {
    console.error("[SentimentAnalysis] Error analyzing sentiment:", error);
    // Return neutral sentiment on error
    return {
      text,
      sentiment: "neutral",
      confidence: 0,
      emotion: "neutral",
      emotionScore: 0,
      keyPhrases: [],
      tone: "professional",
    };
  }
}

/**
 * Analyze sentiment for multiple segments in a batch
 * More efficient than individual calls
 */
export async function analyzeSentimentBatch(
  segments: Array<{ id: number; text: string }>
): Promise<SentimentScore[]> {
  try {
    const results: SentimentScore[] = [];

    // Process in parallel (max 5 at a time to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < segments.length; i += batchSize) {
      const batch = segments.slice(i, i + batchSize);
      const promises = batch.map(async (segment) => {
        const analysis = await analyzeSentiment(segment.text);
        return {
          segmentId: segment.id,
          ...analysis,
        };
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    return results;
  } catch (error) {
    console.error("[SentimentAnalysis] Error in batch analysis:", error);
    return [];
  }
}

/**
 * Store sentiment analysis results in database
 */
export async function storeSentimentAnalysis(
  segmentId: number,
  sentiment: SentimentScore
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Update segment with sentiment data
    await db
      .update(occTranscriptionSegments)
      .set({
        sentiment: sentiment.sentiment,
        sentimentConfidence: sentiment.confidence,
        emotion: sentiment.emotion,
        emotionScore: sentiment.emotionScore,
        keyPhrases: JSON.stringify(sentiment.keyPhrases),
        tone: sentiment.tone,
      })
      .where(eq(occTranscriptionSegments.id, segmentId));

    console.log(
      `[SentimentAnalysis] Stored sentiment for segment ${segmentId}: ${sentiment.sentiment} (${sentiment.emotion})`
    );
  } catch (error) {
    console.error("[SentimentAnalysis] Error storing sentiment:", error);
  }
}

/**
 * Analyze sentiment for all segments in a conference
 */
export async function analyzeConferenceSentiment(conferenceId: number): Promise<SentimentBatch> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get all segments for conference
    const segments = await db
      .select()
      .from(occTranscriptionSegments)
      .where(eq(occTranscriptionSegments.conferenceId, conferenceId));

    if (segments.length === 0) {
      return {
        conferenceId,
        segments: [],
        overallSentiment: "neutral",
        averageConfidence: 0,
        emotionDistribution: {},
      };
    }

    // Analyze each segment
    const sentimentScores = await analyzeSentimentBatch(
      segments.map((s) => ({ id: s.id, text: s.text }))
    );

    // Store results
    for (const score of sentimentScores) {
      await storeSentimentAnalysis(score.segmentId, score);
    }

    // Calculate overall metrics
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    const emotionCounts: Record<string, number> = {};

    for (const score of sentimentScores) {
      sentimentCounts[score.sentiment]++;
      emotionCounts[score.emotion] = (emotionCounts[score.emotion] || 0) + 1;
    }

    const totalConfidence =
      sentimentScores.reduce((sum, s) => sum + s.confidence, 0) / sentimentScores.length;

    // Determine overall sentiment
    let overallSentiment: "positive" | "neutral" | "negative" = "neutral";
    if (sentimentCounts.positive > sentimentCounts.negative) {
      overallSentiment = "positive";
    } else if (sentimentCounts.negative > sentimentCounts.positive) {
      overallSentiment = "negative";
    }

    return {
      conferenceId,
      segments: sentimentScores,
      overallSentiment,
      averageConfidence: Math.round(totalConfidence),
      emotionDistribution: emotionCounts,
    };
  } catch (error) {
    console.error("[SentimentAnalysis] Error analyzing conference sentiment:", error);
    return {
      conferenceId,
      segments: [],
      overallSentiment: "neutral",
      averageConfidence: 0,
      emotionDistribution: {},
    };
  }
}

/**
 * Get sentiment trend for a conference
 * Returns sentiment progression over time
 */
export async function getSentimentTrend(
  conferenceId: number,
  windowSize: number = 5
): Promise<Array<{ timestamp: number; sentiment: string; averageScore: number }>> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const segments = await db
      .select()
      .from(occTranscriptionSegments)
      .where(eq(occTranscriptionSegments.conferenceId, conferenceId));

    if (segments.length === 0) {
      return [];
    }

    const trend: Array<{ timestamp: number; sentiment: string; averageScore: number }> = [];

    // Process segments in windows
    for (let i = 0; i < segments.length; i += windowSize) {
      const window = segments.slice(i, i + windowSize);
      const avgConfidence =
        window.reduce((sum, s) => sum + (s.sentimentConfidence || 0), 0) / window.length;

      // Determine window sentiment
      const sentiments = window.map((s) => s.sentiment).filter(Boolean);
      const sentimentCounts = {
        positive: sentiments.filter((s) => s === "positive").length,
        neutral: sentiments.filter((s) => s === "neutral").length,
        negative: sentiments.filter((s) => s === "negative").length,
      };

      let windowSentiment = "neutral";
      if (sentimentCounts.positive > sentimentCounts.negative) {
        windowSentiment = "positive";
      } else if (sentimentCounts.negative > sentimentCounts.positive) {
        windowSentiment = "negative";
      }

      trend.push({
        timestamp: window[0]?.startTime || 0,
        sentiment: windowSentiment,
        averageScore: Math.round(avgConfidence),
      });
    }

    return trend;
  } catch (error) {
    console.error("[SentimentAnalysis] Error getting sentiment trend:", error);
    return [];
  }
}

/**
 * Get speaker sentiment profile
 * Shows sentiment distribution for each speaker
 */
export async function getSpeakerSentimentProfile(
  conferenceId: number
): Promise<Record<string, { positive: number; neutral: number; negative: number; avgEmotion: string }>> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const segments = await db
      .select()
      .from(occTranscriptionSegments)
      .where(eq(occTranscriptionSegments.conferenceId, conferenceId));

    const profile: Record<string, { positive: number; neutral: number; negative: number; emotions: string[] }> = {};

    for (const segment of segments) {
      if (!segment.speakerName) continue;

      if (!profile[segment.speakerName]) {
        profile[segment.speakerName] = {
          positive: 0,
          neutral: 0,
          negative: 0,
          emotions: [],
        };
      }

      if (segment.sentiment) {
        profile[segment.speakerName][segment.sentiment as "positive" | "neutral" | "negative"]++;
      }
      if (segment.emotion) {
        profile[segment.speakerName].emotions.push(segment.emotion);
      }
    }

    // Convert to final format
    const result: Record<string, { positive: number; neutral: number; negative: number; avgEmotion: string }> = {};
    for (const [speaker, data] of Object.entries(profile)) {
      const emotionCounts = data.emotions.reduce(
        (acc, e) => {
          acc[e] = (acc[e] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const avgEmotion = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral";

      result[speaker] = {
        positive: data.positive,
        neutral: data.neutral,
        negative: data.negative,
        avgEmotion,
      };
    }

    return result;
  } catch (error) {
    console.error("[SentimentAnalysis] Error getting speaker profile:", error);
    return {};
  }
}
