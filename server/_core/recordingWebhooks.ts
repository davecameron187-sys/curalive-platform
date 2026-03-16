import { analyzeTranscriptSentiment } from "./sentimentAnalysis";
import { generateTranscriptSummary } from "./summaryGeneration";
import { notifyOwner } from "./notification";

/**
 * Auto-trigger sentiment analysis and summary generation for a recording
 * Can be called from tRPC procedures or webhook handlers
 */
export async function triggerRecordingAnalysis(
  transcriptText: string,
  durationSeconds: number,
  recordingId: number
) {
  try {
    console.log(`[RecordingWebhooks] Starting analysis for recording ${recordingId}`);

    // Run sentiment analysis
    const sentimentResult = await analyzeTranscriptSentiment(recordingId, transcriptText);

    console.log(`[RecordingWebhooks] Sentiment analysis completed:`, {
      sentiment: sentimentResult.overallSentiment,
      score: sentimentResult.overallScore,
    });

    // Run summary generation
    const summaryResult = await generateTranscriptSummary(transcriptText, durationSeconds);

    console.log(`[RecordingWebhooks] Summary generation completed with ${summaryResult.keyPoints.length} key points`);

    // Notify owner of completion
    await notifyOwner({
      title: "Recording Analysis Complete",
      content: `Sentiment analysis and summary for recording ${recordingId} completed. Overall sentiment: ${sentimentResult.overallSentiment}`,
    });

    return {
      recordingId,
      sentiment: sentimentResult,
      summary: summaryResult,
      status: "completed",
    };
  } catch (error) {
    console.error(`[RecordingWebhooks] Error during recording analysis:`, error);

    // Notify owner of error
    await notifyOwner({
      title: "Recording Analysis Failed",
      content: `Error analyzing recording ${recordingId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    });

    throw error;
  }
}

/**
 * Generate comparison analytics across multiple recordings
 * Aggregates sentiment data for trend analysis
 */
export async function generateComparisonAnalytics(
  recordings: Array<{
    id: number;
    transcriptText: string;
    durationSeconds: number;
    date: Date;
  }>
) {
  const results = [];

  for (const recording of recordings) {
    try {
      const sentiment = await analyzeTranscriptSentiment(recording.id, recording.transcriptText);
      results.push({
        recordingId: recording.id,
        date: recording.date,
        sentiment: sentiment.overallSentiment,
        score: sentiment.overallScore,
        positiveCount: sentiment.positiveCount,
        neutralCount: sentiment.neutralCount,
        negativeCount: sentiment.negativeCount,
      });
    } catch (error) {
      console.error(`[ComparisonAnalytics] Error processing recording ${recording.id}:`, error);
    }
  }

  // Calculate trends
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const positiveCount = results.filter((r) => r.sentiment === "positive").length;
  const negativeCount = results.filter((r) => r.sentiment === "negative").length;

  return {
    totalRecordings: results.length,
    averageScore: avgScore,
    positivePercentage: (positiveCount / results.length) * 100,
    negativePercentage: (negativeCount / results.length) * 100,
    recordings: results,
  };
}
