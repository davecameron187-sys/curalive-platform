import { invokeLLM } from "./llm";

export interface TranscriptSummary {
  summaryText: string;
  keyPoints: string[];
  actionItems: string[];
  speakers: string[];
}

/**
 * Generate executive summary from a green room recording transcript using LLM
 * Called automatically when recording transcription is completed
 */
export async function generateTranscriptSummary(
  transcriptText: string,
  duration: number
): Promise<TranscriptSummary> {
  if (!transcriptText || transcriptText.trim().length === 0) {
    throw new Error("Transcript text is empty");
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert at creating executive summaries. Analyze the following transcript and provide:
1. A concise executive summary (200-500 words)
2. 3-5 key discussion points
3. Any action items or next steps mentioned
4. Names/roles of speakers identified

Respond ONLY with valid JSON matching this structure:
{
  "summaryText": "executive summary here",
  "keyPoints": ["point1", "point2", "point3"],
  "actionItems": ["action1", "action2"],
  "speakers": ["Speaker Name (Role)", "Speaker Name (Role)"]
}`,
      },
      {
        role: "user",
        content: `Generate a summary for this ${Math.round(duration / 60)}-minute recording transcript:\n\n${transcriptText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "transcript_summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summaryText: { type: "string" },
            keyPoints: { type: "array", items: { type: "string" } },
            actionItems: { type: "array", items: { type: "string" } },
            speakers: { type: "array", items: { type: "string" } },
          },
          required: ["summaryText", "keyPoints", "actionItems", "speakers"],
          additionalProperties: false,
        },
      },
    },
  });

  const result = JSON.parse(response.choices[0].message.content as string) as TranscriptSummary;
  return result;
}
