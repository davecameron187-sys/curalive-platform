// @ts-nocheck
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  IpoIntelligenceService,
  MandAIntelligenceService,
  CreditBondholderIntelligenceService,
  ActivistProxyIntelligenceService,
} from "../services/IpoMandAIntelligenceService";

export const ipoMandARouter = router({
  // ─── IPO Intelligence ──────────────────────────────────────────────────────
  analyzePricingSensitivity: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      companyName: z.string().max(255),
      sector: z.string().max(100),
      proposedRange: z.string().max(100).optional(),
      comparableIPOs: z.array(z.string().max(255)).max(10).optional(),
    }))
    .mutation(async ({ input }) => {
      return IpoIntelligenceService.analyzePricingSensitivity(input);
    }),

  detectBookBuildingSignals: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      companyName: z.string().max(255),
      targetRaise: z.string().max(100),
    }))
    .mutation(async ({ input }) => {
      return IpoIntelligenceService.detectBookBuildingSignals(input);
    }),

  assessIPOReadiness: protectedProcedure
    .input(z.object({
      companyName: z.string().max(255),
      sector: z.string().max(100),
      financialSummary: z.string().max(5000),
      governanceNotes: z.string().max(5000),
      marketConditions: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      return IpoIntelligenceService.assessIPOReadiness(input);
    }),

  scanIPORegulatoryRedFlags: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      jurisdiction: z.enum(["JSE", "SEC", "FCA", "HKEX", "ASX"]),
      isQuietPeriod: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      return IpoIntelligenceService.scanRegulatoryRedFlags(input);
    }),

  // ─── M&A Intelligence ─────────────────────────────────────────────────────
  monitorOfferCompliance: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      dealType: z.enum(["friendly", "hostile", "merger_of_equals", "scheme_of_arrangement"]),
      jurisdiction: z.enum(["JSE", "SEC", "FCA", "EU"]),
      offerPrice: z.string().max(100).optional(),
      targetCompany: z.string().max(255),
      acquirerCompany: z.string().max(255),
    }))
    .mutation(async ({ input }) => {
      return MandAIntelligenceService.monitorOfferPeriodCompliance(input);
    }),

  detectInformationLeaks: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      isPreAnnouncement: z.boolean(),
      knownInsiders: z.array(z.string().max(255)).max(50).default([]),
    }))
    .mutation(async ({ input }) => {
      return MandAIntelligenceService.detectInformationLeaks(input);
    }),

  analyzeSynergies: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      acquirerCompany: z.string().max(255),
      targetCompany: z.string().max(255),
      statedSynergies: z.string().max(2000).optional(),
      sector: z.string().max(100),
    }))
    .mutation(async ({ input }) => {
      return MandAIntelligenceService.analyzeSynergyValidation(input);
    }),

  mapStakeholderImpact: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      acquirerCompany: z.string().max(255),
      targetCompany: z.string().max(255),
      dealSize: z.string().max(100),
      sector: z.string().max(100),
    }))
    .mutation(async ({ input }) => {
      return MandAIntelligenceService.mapStakeholderImpact(input);
    }),

  predictDealCertainty: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      acquirerCompany: z.string().max(255),
      targetCompany: z.string().max(255),
      dealType: z.string().max(100),
      jurisdiction: z.string().max(50),
      announcedDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return MandAIntelligenceService.predictDealCertainty(input);
    }),

  // ─── Credit & Bondholder Intelligence ──────────────────────────────────────
  analyzeCreditSpreadImpact: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      companyName: z.string().max(255),
      currentRating: z.string().max(20),
      sector: z.string().max(100),
    }))
    .mutation(async ({ input }) => {
      return CreditBondholderIntelligenceService.analyzeCreditSpreadImpact(input);
    }),

  scanCovenantCompliance: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      companyName: z.string().max(255),
      knownCovenants: z.array(z.string().max(255)).max(20).optional(),
    }))
    .mutation(async ({ input }) => {
      return CreditBondholderIntelligenceService.scanCovenantCompliance(input);
    }),

  // ─── Activist & Proxy Intelligence ─────────────────────────────────────────
  detectActivistCampaign: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      companyName: z.string().max(255),
      knownActivists: z.array(z.string().max(255)).max(20).optional(),
    }))
    .mutation(async ({ input }) => {
      return ActivistProxyIntelligenceService.detectActivistCampaign(input);
    }),

  predictProxyVote: protectedProcedure
    .input(z.object({
      transcript: z.string().max(20000),
      companyName: z.string().max(255),
      resolutions: z.array(z.object({
        id: z.string(),
        description: z.string().max(500),
        managementRecommendation: z.enum(["for", "against"]),
      })).min(1).max(20),
      shareholderBase: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      return ActivistProxyIntelligenceService.predictProxyVote(input);
    }),
});
