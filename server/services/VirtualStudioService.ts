// @ts-nocheck
import { getDb } from "../db";
import { virtualStudios, esgStudioFlags, studioInterconnections } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

const BUNDLE_CONFIGS: Record<string, {
  primaryColor: string;
  accentColor: string;
  avatarDefaults: string[];
  overlays: string[];
  logoPosition: string;
}> = {
  A: { primaryColor: "#3b82f6", accentColor: "#1d4ed8", avatarDefaults: ["executive", "professional"], overlays: ["sentiment-gauge", "investor-ticker"], logoPosition: "top-right" },
  B: { primaryColor: "#ef4444", accentColor: "#991b1b", avatarDefaults: ["professional", "formal"], overlays: ["compliance-indicator", "risk-meter"], logoPosition: "top-left" },
  C: { primaryColor: "#10b981", accentColor: "#065f46", avatarDefaults: ["casual", "professional"], overlays: ["engagement-bar", "pace-indicator"], logoPosition: "top-right" },
  D: { primaryColor: "#f59e0b", accentColor: "#92400e", avatarDefaults: ["creative", "professional"], overlays: ["social-ticker", "content-score"], logoPosition: "bottom-right" },
  E: { primaryColor: "#8b5cf6", accentColor: "#4c1d95", avatarDefaults: ["executive", "animated", "professional"], overlays: ["full-suite", "ai-insights", "sentiment-gauge"], logoPosition: "top-right" },
  F: { primaryColor: "#ec4899", accentColor: "#831843", avatarDefaults: ["social", "energetic"], overlays: ["social-ticker", "engagement-bar"], logoPosition: "bottom-left" },
};

export class VirtualStudioService {
  async createOrUpdateStudio(eventId: string, bundleId: string, config: Partial<{
    studioName: string;
    avatarStyle: string;
    primaryLanguage: string;
    dubbingLanguages: string[];
    esgEnabled: boolean;
    replayEnabled: boolean;
  }>) {
    const db = await getDb();
    const existing = await db.select().from(virtualStudios).where(eq(virtualStudios.eventId, eventId));

    const values = {
      eventId,
      bundleId,
      studioName: config.studioName ?? "My Virtual Studio",
      avatarStyle: config.avatarStyle ?? "professional",
      primaryLanguage: config.primaryLanguage ?? "en",
      dubbingLanguages: config.dubbingLanguages ? JSON.stringify(config.dubbingLanguages) : null,
      esgEnabled: config.esgEnabled ?? false,
      replayEnabled: config.replayEnabled ?? true,
    };

    if (existing.length > 0) {
      await db.update(virtualStudios).set(values).where(eq(virtualStudios.eventId, eventId));
      return existing[0];
    } else {
      await db.insert(virtualStudios).values(values);
      const created = await db.select().from(virtualStudios).where(eq(virtualStudios.eventId, eventId));
      return created[0];
    }
  }

  async getStudio(eventId: string) {
    const db = await getDb();
    const rows = await db.select().from(virtualStudios).where(eq(virtualStudios.eventId, eventId));
    return rows[0] ?? null;
  }

  getBundleCustomization(bundleId: string) {
    return BUNDLE_CONFIGS[bundleId] ?? BUNDLE_CONFIGS.E;
  }

  generateInterconnectionOverlays(bundleId: string) {
    const config = this.getBundleCustomization(bundleId);
    return {
      overlays: config.overlays,
      positions: {
        "sentiment-gauge": { x: "10px", y: "40px", width: "180px" },
        "engagement-bar": { x: "10px", y: "bottom: 40px", width: "100%" },
        "compliance-indicator": { x: "right: 10px", y: "40px", width: "140px" },
        "investor-ticker": { x: "0", y: "bottom: 0", width: "100%" },
        "social-ticker": { x: "right: 10px", y: "bottom: 60px", width: "240px" },
        "ai-insights": { x: "10px", y: "40px", width: "200px" },
      },
      color: config.primaryColor,
    };
  }

  async flagESGContent(studioId: number, content: string) {
    const db = await getDb();

    const result = await invokeLLM({
      prompt: `Analyse this webcast content for ESG (Environmental, Social, Governance) concerns:

"${content.slice(0, 800)}"

Return a JSON array of flags. Each flag: { flagType: string, description: string, severity: "low"|"medium"|"high", contentSnippet: string }.
If no ESG concerns, return empty array [].`,
      systemPrompt: "You are an ESG compliance officer reviewing investor event content. Flag any content that could be problematic for ESG reporting, greenwashing, discriminatory language, governance issues, or misleading sustainability claims.",
      response_format: { type: "json_object" },
    });

    let flags: any[] = [];
    try {
      const parsed = JSON.parse(result);
      flags = parsed.flags ?? parsed ?? [];
      if (!Array.isArray(flags)) flags = [];
    } catch {
      flags = [];
    }

    for (const f of flags) {
      await db.insert(esgStudioFlags).values({
        studioId,
        flagType: f.flagType ?? "general",
        description: f.description ?? "",
        severity: f.severity ?? "medium",
        contentSnippet: f.contentSnippet ?? content.slice(0, 200),
      });
    }

    return { flagsCreated: flags.length, flags };
  }

  async getESGReport(studioId: number) {
    const db = await getDb();
    const flags = await db.select().from(esgStudioFlags).where(eq(esgStudioFlags.studioId, studioId));
    return {
      totalFlags: flags.length,
      resolved: flags.filter(f => f.resolvedAt !== null).length,
      open: flags.filter(f => f.resolvedAt === null).length,
      bySeverity: {
        high: flags.filter(f => f.severity === "high").length,
        medium: flags.filter(f => f.severity === "medium").length,
        low: flags.filter(f => f.severity === "low").length,
      },
      flags,
    };
  }

  async resolveFlag(flagId: number) {
    const db = await getDb();
    await db.update(esgStudioFlags)
      .set({ resolvedAt: new Date() })
      .where(eq(esgStudioFlags.id, flagId));
    return { success: true };
  }
}

export const virtualStudioService = new VirtualStudioService();
