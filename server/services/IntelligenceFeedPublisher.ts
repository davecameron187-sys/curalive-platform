/**
 * IntelligenceFeedPublisher.ts
 * Phase 3 Task 2 — Real-Time Ably Integration
 * Publishes governed intelligence feed items to Ably after governance decision is recorded.
 * NEVER throws. NEVER breaks governance pipeline.
 */

import { rawSql } from "../db";
import { AblyRealtimeService } from "./AblyRealtimeService";

export async function publishFeedItem(params: {
  sessionId: number;
  feedItemId: number;
  feedType: string;
  severity: string;
  title: string;
  body: string;
  pipeline: string;
  decision: string;
}): Promise<void> {
  try {
    const [rows] = await rawSql(
      `SELECT ably_channel FROM shadow_sessions WHERE id = $1 LIMIT 1`,
      [params.sessionId]
    );

    const session = rows?.[0];
    const ablyChannel = session?.ably_channel;

    if (!ablyChannel) {
      console.warn(
        `[FeedPublisher] No ably_channel found for sessionId=${params.sessionId}, feedItemId=${params.feedItemId} — skipping publish`
      );
      return;
    }

    await AblyRealtimeService.publishToEvent(ablyChannel, "intelligence_feed", {
      id: params.feedItemId,
      feed_type: params.feedType,
      severity: params.severity,
      title: params.title,
      body: params.body,
      pipeline: params.pipeline,
      decision: params.decision,
      created_at: new Date().toISOString(),
    });

    console.log(
      `[FeedPublisher] Published feedItemId=${params.feedItemId} to channel=${ablyChannel} decision=${params.decision}`
    );
  } catch (err: any) {
    console.error(
      `[FeedPublisher] FAILED — sessionId=${params.sessionId} feedItemId=${params.feedItemId} error=${err?.message}`
    );
  }
}
