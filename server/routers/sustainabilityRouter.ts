// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";

async function rawQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
  const conn = (db as any).session?.client ?? (db as any).$client;
  const [rows] = await conn.execute(query, params);
  return rows as T[];
}

async function rawExecute(query: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const conn = (db as any).session?.client ?? (db as any).$client;
  await conn.execute(query, params);
}

const EMISSION_FACTORS = {
  flightShortHaul: 0.255,
  flightMediumHaul: 0.156,
  flightLongHaul: 0.195,
  hotelNightKg: 21.2,
  taxiPerKm: 0.21,
  mealKg: 2.5,
  printedMaterialsPerAttendee: 0.8,
  venuePerHourKg: 45.0,
  virtualPerHourKg: 0.04,
  electricityPerKwh: 0.5,
};

const COST_FACTORS_USD = {
  flightDomestic: 450,
  flightInternational: 1800,
  hotelPerNight: 180,
  mealPerDay: 65,
  venuePerDay: 3500,
  printedMaterials: 12,
  groundTransport: 85,
};

function calculateSustainabilityGrade(savingsPercent: number): string {
  if (savingsPercent >= 90) return "A+";
  if (savingsPercent >= 80) return "A";
  if (savingsPercent >= 70) return "B+";
  if (savingsPercent >= 60) return "B";
  if (savingsPercent >= 50) return "C+";
  if (savingsPercent >= 40) return "C";
  if (savingsPercent >= 30) return "D";
  return "F";
}

export const sustainabilityRouter = router({

  calculateEvent: publicProcedure
    .input(z.object({
      eventId: z.string().optional(),
      eventTitle: z.string().optional(),
      totalAttendees: z.number().min(1),
      durationHours: z.number().min(0.5).max(24),
      isVirtual: z.boolean().default(true),
      domesticAttendees: z.number().default(0),
      internationalAttendees: z.number().default(0),
      avgDomesticFlightKm: z.number().default(800),
      avgInternationalFlightKm: z.number().default(4000),
      hotelNights: z.number().default(0),
      cateringMeals: z.number().default(0),
      printedPacks: z.number().default(0),
      venueHours: z.number().default(0),
      country: z.string().default("ZA"),
    }))
    .mutation(async ({ input }) => {
      const domesticFlightCO2 = input.domesticAttendees * input.avgDomesticFlightKm * EMISSION_FACTORS.flightShortHaul;
      const internationalFlightCO2 = input.internationalAttendees * input.avgInternationalFlightKm * EMISSION_FACTORS.flightLongHaul;
      const totalFlightCO2 = (domesticFlightCO2 + internationalFlightCO2) / 1000;

      const hotelCO2 = (input.hotelNights * EMISSION_FACTORS.hotelNightKg) / 1000;
      const taxiCO2 = ((input.domesticAttendees + input.internationalAttendees) * 25 * EMISSION_FACTORS.taxiPerKm) / 1000;
      const mealCO2 = (input.cateringMeals * EMISSION_FACTORS.mealKg) / 1000;
      const printCO2 = (input.printedPacks * EMISSION_FACTORS.printedMaterialsPerAttendee) / 1000;
      const venueCO2 = (input.venueHours * EMISSION_FACTORS.venuePerHourKg) / 1000;

      const physicalTotal = totalFlightCO2 + hotelCO2 + taxiCO2 + mealCO2 + printCO2 + venueCO2;

      const virtualCO2 = (input.totalAttendees * input.durationHours * EMISSION_FACTORS.virtualPerHourKg) / 1000;

      const carbonSaved = Math.max(0, physicalTotal - virtualCO2);
      const savingsPercent = physicalTotal > 0 ? (carbonSaved / physicalTotal) * 100 : 95;

      const flightCostAvoided = (input.domesticAttendees * COST_FACTORS_USD.flightDomestic) +
        (input.internationalAttendees * COST_FACTORS_USD.flightInternational);
      const hotelCostAvoided = input.hotelNights * COST_FACTORS_USD.hotelPerNight;
      const mealCostAvoided = input.cateringMeals * COST_FACTORS_USD.mealPerDay;
      const venueCostAvoided = (input.venueHours / 8) * COST_FACTORS_USD.venuePerDay;
      const printCostAvoided = input.printedPacks * COST_FACTORS_USD.printedMaterials;
      const transportCostAvoided = (input.domesticAttendees + input.internationalAttendees) * COST_FACTORS_USD.groundTransport;
      const totalCostAvoided = flightCostAvoided + hotelCostAvoided + mealCostAvoided + venueCostAvoided + printCostAvoided + transportCostAvoided;

      const treesEquivalent = Math.round(carbonSaved / 0.022);
      const carsOffRoadDays = Math.round(carbonSaved / (4.6 / 365));
      const smartphoneCharges = Math.round(carbonSaved * 1000 / 0.008);

      const grade = calculateSustainabilityGrade(savingsPercent);

      const breakdown = {
        flights: { co2Tonnes: Number(totalFlightCO2.toFixed(3)), costAvoided: flightCostAvoided, attendees: input.domesticAttendees + input.internationalAttendees },
        accommodation: { co2Tonnes: Number(hotelCO2.toFixed(3)), costAvoided: hotelCostAvoided, nights: input.hotelNights },
        groundTransport: { co2Tonnes: Number(taxiCO2.toFixed(3)), costAvoided: transportCostAvoided },
        catering: { co2Tonnes: Number(mealCO2.toFixed(3)), costAvoided: mealCostAvoided, meals: input.cateringMeals },
        printedMaterials: { co2Tonnes: Number(printCO2.toFixed(3)), costAvoided: printCostAvoided, packs: input.printedPacks },
        venue: { co2Tonnes: Number(venueCO2.toFixed(3)), costAvoided: venueCostAvoided, hours: input.venueHours },
        virtualFootprint: { co2Tonnes: Number(virtualCO2.toFixed(6)) },
      };

      if (input.eventId) {
        await rawExecute(`
          INSERT INTO sustainability_reports
            (event_id, event_title, total_attendees, duration_hours, is_virtual,
             physical_co2_tonnes, virtual_co2_tonnes, carbon_saved_tonnes, savings_percent,
             total_cost_avoided_usd, grade, breakdown_json, country)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            physical_co2_tonnes = VALUES(physical_co2_tonnes),
            virtual_co2_tonnes = VALUES(virtual_co2_tonnes),
            carbon_saved_tonnes = VALUES(carbon_saved_tonnes),
            savings_percent = VALUES(savings_percent),
            total_cost_avoided_usd = VALUES(total_cost_avoided_usd),
            grade = VALUES(grade),
            breakdown_json = VALUES(breakdown_json),
            updated_at = NOW()
        `, [
          input.eventId, input.eventTitle ?? input.eventId, input.totalAttendees, input.durationHours,
          input.isVirtual ? 1 : 0, physicalTotal, virtualCO2, carbonSaved, savingsPercent,
          totalCostAvoided, grade, JSON.stringify(breakdown), input.country,
        ]);
      }

      return {
        physicalCO2Tonnes: Number(physicalTotal.toFixed(3)),
        virtualCO2Tonnes: Number(virtualCO2.toFixed(6)),
        carbonSavedTonnes: Number(carbonSaved.toFixed(3)),
        savingsPercent: Number(savingsPercent.toFixed(1)),
        totalCostAvoidedUSD: Math.round(totalCostAvoided),
        grade,
        breakdown,
        equivalents: { treesEquivalent, carsOffRoadDays, smartphoneCharges },
      };
    }),

  getReport: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const [report] = await rawQuery(`SELECT * FROM sustainability_reports WHERE event_id = ? LIMIT 1`, [input.eventId]);
      if (!report) return null;
      return {
        ...report,
        breakdownJson: typeof report.breakdown_json === 'string' ? JSON.parse(report.breakdown_json) : report.breakdown_json,
      };
    }),

  getAggregateStats: publicProcedure.query(async () => {
    const [stats] = await rawQuery(`
      SELECT
        COUNT(*) AS total_events,
        SUM(carbon_saved_tonnes) AS total_carbon_saved,
        SUM(total_cost_avoided_usd) AS total_cost_saved,
        AVG(savings_percent) AS avg_savings_percent,
        SUM(total_attendees) AS total_attendees,
        SUM(duration_hours) AS total_hours
      FROM sustainability_reports
    `);

    const byGrade = await rawQuery(`
      SELECT grade, COUNT(*) AS count FROM sustainability_reports GROUP BY grade ORDER BY grade
    `);

    const totalSaved = Number(stats?.total_carbon_saved ?? 0);

    return {
      totalEvents: Number(stats?.total_events ?? 0),
      totalCarbonSavedTonnes: Number(totalSaved.toFixed(2)),
      totalCostSavedUSD: Number(stats?.total_cost_saved ?? 0),
      avgSavingsPercent: Number(Number(stats?.avg_savings_percent ?? 0).toFixed(1)),
      totalAttendeesReached: Number(stats?.total_attendees ?? 0),
      totalEventHours: Number(stats?.total_hours ?? 0),
      treesEquivalent: Math.round(totalSaved / 0.022),
      byGrade,
    };
  }),

  generateESGNarrative: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input }) => {
      const [report] = await rawQuery(`SELECT * FROM sustainability_reports WHERE event_id = ? LIMIT 1`, [input.eventId]);
      if (!report) return { success: false, error: "No sustainability report found for this event" };

      let narrative = '';
      try {
        const prompt = `You are an ESG reporting specialist. Generate a professional sustainability narrative for an investor event.

Event: ${report.event_title}
Attendees: ${report.total_attendees}
Duration: ${report.duration_hours} hours
Carbon Saved: ${Number(report.carbon_saved_tonnes).toFixed(2)} tonnes CO₂e
Cost Avoided: $${Number(report.total_cost_avoided_usd).toLocaleString()}
Sustainability Grade: ${report.grade}
Savings vs Physical: ${Number(report.savings_percent).toFixed(1)}%

Write a 3-paragraph ESG disclosure narrative suitable for an annual sustainability report or CDP submission. Reference specific metrics. Use formal, investor-grade language.`;

        const result = await invokeLLM(prompt, { maxTokens: 400 });
        narrative = result.choices?.[0]?.message?.content ?? '';
      } catch {
        narrative = `This virtual event avoided an estimated ${Number(report.carbon_saved_tonnes).toFixed(2)} tonnes of CO₂e emissions compared to a physical equivalent, achieving a sustainability grade of ${report.grade}. The event reached ${report.total_attendees} participants while avoiding approximately $${Number(report.total_cost_avoided_usd).toLocaleString()} in travel and venue costs.`;
      }

      return { success: true, narrative, grade: report.grade };
    }),
});
