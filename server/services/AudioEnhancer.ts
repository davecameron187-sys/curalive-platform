// @ts-nocheck
import { getDb } from "../db";
import { webcastEnhancements } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface AudioEnhancementConfig {
  eventId: string;
  noiseEnhancementEnabled: boolean;
  noiseGateEnabled: boolean;
  echoCancellationEnabled: boolean;
  autoGainEnabled: boolean;
  adaptiveVolume: boolean;
  noiseGateThresholdDb: number;
  targetLoudnessLufs: number;
}

export class AudioEnhancer {
  async getConfig(eventId: string): Promise<AudioEnhancementConfig> {
    const db = getDb();

    const rows = await db
      .select()
      .from(webcastEnhancements)
      .where(eq(webcastEnhancements.eventId, eventId))
      .limit(1)
      .catch(() => []);

    if (rows.length > 0) {
      const row = rows[0] as any;
      return {
        eventId,
        noiseEnhancementEnabled: row.noiseEnhancementEnabled ?? true,
        noiseGateEnabled: row.noiseGateEnabled ?? true,
        echoCancellationEnabled: row.echoCancellationEnabled ?? true,
        autoGainEnabled: row.autoGainEnabled ?? false,
        adaptiveVolume: true,
        noiseGateThresholdDb: -40,
        targetLoudnessLufs: -16,
      };
    }

    return {
      eventId,
      noiseEnhancementEnabled: true,
      noiseGateEnabled: true,
      echoCancellationEnabled: true,
      autoGainEnabled: false,
      adaptiveVolume: true,
      noiseGateThresholdDb: -40,
      targetLoudnessLufs: -16,
    };
  }

  async updateConfig(eventId: string, config: Partial<AudioEnhancementConfig>): Promise<AudioEnhancementConfig> {
    const db = getDb();

    const existing = await db
      .select()
      .from(webcastEnhancements)
      .where(eq(webcastEnhancements.eventId, eventId))
      .limit(1)
      .catch(() => []);

    const updateData = {
      noiseEnhancementEnabled: config.noiseEnhancementEnabled ?? true,
      noiseGateEnabled: config.noiseGateEnabled ?? true,
      echoCancellationEnabled: config.echoCancellationEnabled ?? true,
      autoGainEnabled: config.autoGainEnabled ?? false,
    };

    if (existing.length > 0) {
      await db.update(webcastEnhancements).set(updateData).where(eq(webcastEnhancements.eventId, eventId)).catch(() => {});
    } else {
      await db.insert(webcastEnhancements).values({ eventId, ...updateData }).catch(() => {});
    }

    return this.getConfig(eventId);
  }
}

export const audioEnhancer = new AudioEnhancer();
