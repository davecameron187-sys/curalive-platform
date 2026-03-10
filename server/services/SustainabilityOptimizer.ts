import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { webcastRegistrations, webcastEvents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface SustainabilityScore {
  grade: "A+" | "A" | "B" | "C" | "D";
  score: number;
  carbonSavedKg: number;
  carbonFootprintKg: number;
  attendeesTravelAvoided: number;
  equivalentTreeDays: number;
  serverEnergyKwh: number;
  bandwidthCo2Kg: number;
  breakdown: {
    travelSavings: number;
    serverCost: number;
    bandwidthCost: number;
    netSaving: number;
  };
  suggestions: string[];
  certificate: {
    eventTitle: string;
    eventId: string;
    issuedAt: string;
    totalCarbonSavedKg: number;
    grade: string;
    badgeText: string;
  };
}

const AVG_TRAVEL_KM = 180;
const CO2_PER_KM_KG = 0.21;
const SERVER_KWH_PER_HOUR = 0.35;
const CO2_PER_KWH_KG = 0.233;
const BANDWIDTH_GB_PER_VIEWER_HOUR = 2.7;
const CO2_PER_GB_KG = 0.006;

export class SustainabilityOptimizer {
  async calculate(eventId: string, durationHours = 1.5): Promise<SustainabilityScore> {
    const db = getDb();

    const [registrations, events] = await Promise.all([
      db.select().from(webcastRegistrations).where(eq(webcastRegistrations.eventId, eventId)).catch(() => []),
      db
        .select()
        .from(webcastEvents)
        .where(eq(webcastEvents.id, eventId as any))
        .limit(1)
        .catch(() => []),
    ]);

    const attendeeCount = Math.max(registrations.length, 1);
    const eventTitle = (events[0] as any)?.title ?? "CuraLive Event";

    const travelSavedKg = attendeeCount * AVG_TRAVEL_KM * CO2_PER_KM_KG;
    const serverKwh = SERVER_KWH_PER_HOUR * durationHours;
    const serverCo2 = serverKwh * CO2_PER_KWH_KG;
    const bandwidthGb = attendeeCount * BANDWIDTH_GB_PER_VIEWER_HOUR * durationHours;
    const bandwidthCo2 = bandwidthGb * CO2_PER_GB_KG;
    const totalFootprint = serverCo2 + bandwidthCo2;
    const netSaved = travelSavedKg - totalFootprint;
    const treeEquivalent = Math.round(netSaved / 21.77);

    let grade: SustainabilityScore["grade"] = "B";
    let score = 60;
    if (netSaved > 5000) { grade = "A+"; score = 98; }
    else if (netSaved > 1000) { grade = "A"; score = 90; }
    else if (netSaved > 200) { grade = "B"; score = 75; }
    else if (netSaved > 0) { grade = "C"; score = 55; }
    else { grade = "D"; score = 35; }

    const prompt = `Generate 3 actionable sustainability suggestions for a virtual investor event with ${attendeeCount} attendees.
The event saved approximately ${netSaved.toFixed(0)}kg CO2 vs in-person. Suggest specific improvements to reduce the digital carbon footprint further.
Return JSON: { "suggestions": ["suggestion1", "suggestion2", "suggestion3"] }`;

    let suggestions = [
      "Schedule events during off-peak hours to use greener electricity grid mix",
      "Enable adaptive video quality to reduce bandwidth consumption by up to 40%",
      "Use CDN edge nodes closest to attendees to minimize data travel distance",
    ];

    try {
      const raw = await invokeLLM({ prompt, systemPrompt: "You are a sustainability advisor.", response_format: { type: "json_object" } });
      suggestions = JSON.parse(raw).suggestions ?? suggestions;
    } catch {}

    return {
      grade,
      score,
      carbonSavedKg: Math.round(netSaved * 10) / 10,
      carbonFootprintKg: Math.round(totalFootprint * 100) / 100,
      attendeesTravelAvoided: attendeeCount,
      equivalentTreeDays: treeEquivalent,
      serverEnergyKwh: Math.round(serverKwh * 100) / 100,
      bandwidthCo2Kg: Math.round(bandwidthCo2 * 100) / 100,
      breakdown: {
        travelSavings: Math.round(travelSavedKg * 10) / 10,
        serverCost: Math.round(serverCo2 * 100) / 100,
        bandwidthCost: Math.round(bandwidthCo2 * 100) / 100,
        netSaving: Math.round(netSaved * 10) / 10,
      },
      suggestions,
      certificate: {
        eventTitle,
        eventId,
        issuedAt: new Date().toISOString(),
        totalCarbonSavedKg: Math.round(netSaved * 10) / 10,
        grade,
        badgeText: `This event saved ${Math.round(netSaved)}kg CO₂ — equivalent to ${treeEquivalent} tree-days of carbon absorption.`,
      },
    };
  }
}

export const sustainabilityOptimizer = new SustainabilityOptimizer();
