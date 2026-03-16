import { invokeLLM } from "./llm";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { occGreenRoomTranscriptions } from "../../drizzle/schema";

export interface SentimentAnalysisResult {
  overallSentiment: "positive" | "neutral" | "negative";
  overallScore: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  emotionScores: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  keyPhrases: {
    positive: string[];
    negative: string[];
  };
}

/**
 * Analyze sentiment of a green room recording transcript using LLM
 * Called automatically when recording transcription is completed
 */
export async function analyzeTranscriptSentiment(
  transcriptionId: number,
  transcriptText: string
): Promise<SentimentAnalysisResult> {
  if (!transcriptText || transcriptText.trim().length === 0) {
    throw new Error("Transcript text is empty");
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a sentiment analysis expert. Analyze the following transcript and provide:
1. Overall sentiment (positive, neutral, or negative)
2. Overall sentiment score (-1 to 1, where -1 is most negative, 1 is most positive)
3. Count of positive, neutral, and negative statements
4. Emotion scores for: joy, sadness, anger, fear, surprise, disgust (0-1 scale)
5. Key positive and negative phrases mentioned

Respond ONLY with valid JSON matching this structure:
{
  "overallSentiment": "positive|neutral|negative",
  "overallScore": -1 to 1,
  "positiveCount": number,
  "neutralCount": number,
  "negativeCount": number,
  "emotionScores": {
    "joy": 0-1,
    "sadness": 0-1,
    "anger": 0-1,
    "fear": 0-1,
    "surprise": 0-1,
    "disgust": 0-1
  },
  "keyPhrases": {
    "positive": ["phrase1", "phrase2"],
    "negative": ["phrase3", "phrase4"]
  }
}`,
      },
      {
        role: "user",
        content: `Analyze this transcript:\n\n${transcriptText}`,
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
            overallSentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
            overallScore: { type: "number", minimum: -1, maximum: 1 },
            positiveCount: { type: "integer", minimum: 0 },
            neutralCount: { type: "integer", minimum: 0 },
            negativeCount: { type: "integer", minimum: 0 },
            emotionScores: {
              type: "object",
              properties: {
                joy: { type: "number", minimum: 0, maximum: 1 },
                sadness: { type: "number", minimum: 0, maximum: 1 },
                anger: { type: "number", minimum: 0, maximum: 1 },
                fear: { type: "number", minimum: 0, maximum: 1 },
                surprise: { type: "number", minimum: 0, maximum: 1 },
                disgust: { type: "number", minimum: 0, maximum: 1 },
              },
              required: ["joy", "sadness", "anger", "fear", "surprise", "disgust"],
              additionalProperties: false,
            },
            keyPhrases: {
              type: "object",
              properties: {
                positive: { type: "array", items: { type: "string" } },
                negative: { type: "array", items: { type: "string" } },
              },
              required: ["positive", "negative"],
              additionalProperties: false,
            },
          },
          required: [
            "overallSentiment",
            "overallScore",
            "positiveCount",
            "neutralCount",
            "negativeCount",
            "emotionScores",
            "keyPhrases",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const result = JSON.parse(response.choices[0].message.content as string) as SentimentAnalysisResult;
  return result;
}
