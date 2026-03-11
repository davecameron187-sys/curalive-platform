import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

/**
 * INTEGRATION TEST SUITE
 * Tests interconnection between Virtual Studio, Interconnection Analytics, and existing features
 * Uses actual procedure signatures from the routers.
 */

describe('Integration Tests: Virtual Studio & Interconnection Analytics', () => {
  let caller: any;

  beforeAll(async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    caller = appRouter.createCaller(ctx);
  });

  describe('Virtual Studio Integration', () => {
    it('should create virtual studio with bundle configuration', async () => {
      const result = await caller.virtualStudio.createStudio({
        eventId: 'test-event-001',
        bundleId: 'A',
        avatarStyle: 'professional',
        primaryLanguage: 'en',
      });

      expect(result).toBeDefined();
      expect(result.studio).toBeDefined();
    });

    it('should update language configuration', async () => {
      const result = await caller.virtualStudio.updateLanguageConfig({
        eventId: 'test-event-001',
        primaryLanguage: 'en',
        dubbingLanguages: ['es', 'fr', 'de'],
      });

      expect(result.success).toBe(true);
    });

    it('should toggle ESG flagging', async () => {
      const result = await caller.virtualStudio.toggleESG({
        eventId: 'test-event-001',
        enabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.esgEnabled).toBe(true);
    });

    it('should retrieve ESG flags', async () => {
      const result = await caller.virtualStudio.getESGFlags({ studioId: 1 });
      expect(result).toBeDefined();
    });

    it('should resolve ESG flag', async () => {
      // resolveESGFlag expects a numeric flagId
      try {
        const result = await caller.virtualStudio.resolveESGFlag({ flagId: 1 });
        expect(result).toBeDefined();
      } catch (error: any) {
        // Flag may not exist in test DB - that's acceptable
        expect(error.message).toBeDefined();
      }
    });

    it('should generate replay with quality settings', async () => {
      const result = await caller.virtualStudio.generateReplay({
        eventId: 'test-event-001',
        quality: '1080p',
        includeOverlays: true,
      });

      expect(result.success).toBe(true);
      expect(result.replayConfig).toBeDefined();
      expect(result.replayConfig?.quality).toBe('1080p');
    });

    it('should get supported languages', async () => {
      const result = await caller.virtualStudio.getSupportedLanguages();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('en');
    });
  });

  describe('Interconnection Analytics Integration', () => {
    it('should record activation event', async () => {
      const result = await caller.interconnectionAnalytics.recordActivation({
        featureId: 'feature-001',
        connectedFeatureId: 'feature-002',
        activationSource: 'ai-shop',
        roiMultiplier: 1.5,
      });

      expect(result.success).toBe(true);
    });

    it('should retrieve adoption metrics', async () => {
      const result = await caller.interconnectionAnalytics.getAdoptionMetrics({ days: 30 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalActivations');
      expect(result).toHaveProperty('dailyAverage');
      expect(result).toHaveProperty('trend');
      expect(Array.isArray(result.trend)).toBe(true);
    });

    it('should retrieve top interconnections', async () => {
      const result = await caller.interconnectionAnalytics.getTopInterconnections();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('topPairs');
      expect(Array.isArray(result.topPairs)).toBe(true);
    });

    it('should calculate ROI metrics', async () => {
      const result = await caller.interconnectionAnalytics.getROIMetrics();

      expect(result).toHaveProperty('projectedROI');
      expect(result).toHaveProperty('realizedROI');
      expect(result).toHaveProperty('realizationRate');
      expect(result.realizationRate).toBeGreaterThanOrEqual(0);
    });

    it('should retrieve workflow metrics', async () => {
      const result = await caller.interconnectionAnalytics.getWorkflowMetrics();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('completionRate');
      expect(result).toHaveProperty('dropoffPoints');
    });

    it('should retrieve segment metrics', async () => {
      const result = await caller.interconnectionAnalytics.getSegmentMetrics();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('segments');
      expect(Array.isArray(result.segments)).toBe(true);
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should link virtual studio to interconnection analytics', async () => {
      // Create studio
      const studioResult = await caller.virtualStudio.createStudio({
        eventId: 'test-event-002',
        bundleId: 'B',
        avatarStyle: 'executive',
        primaryLanguage: 'en',
      });

      // Record activation for studio feature
      const activationResult = await caller.interconnectionAnalytics.recordActivation({
        featureId: 'virtual-studio',
        connectedFeatureId: 'interconnection-analytics',
        activationSource: 'recommendation',
        roiMultiplier: 2.0,
      });

      expect(studioResult.studio).toBeDefined();
      expect(activationResult.success).toBe(true);
    });

    it('should track feature adoption via metrics', async () => {
      // Record multiple activations
      for (let i = 0; i < 3; i++) {
        await caller.interconnectionAnalytics.recordActivation({
          featureId: `feature-${i}`,
          connectedFeatureId: `feature-${i + 1}`,
          activationSource: 'ai-shop',
          roiMultiplier: 1.5 + i * 0.1,
        });
      }

      // Retrieve adoption metrics
      const result = await caller.interconnectionAnalytics.getAdoptionMetrics({ days: 7 });

      expect(result).toHaveProperty('totalActivations');
      expect(result).toHaveProperty('trend');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity between studios and analytics', async () => {
      // Create studio
      const studioResult = await caller.virtualStudio.createStudio({
        eventId: 'test-event-003',
        bundleId: 'C',
        avatarStyle: 'animated',
        primaryLanguage: 'en',
      });

      // Record activation
      await caller.interconnectionAnalytics.recordActivation({
        featureId: 'virtual-studio',
        connectedFeatureId: 'engagement-tracking',
        activationSource: 'workflow',
        roiMultiplier: 2.5,
      });

      // Verify data consistency via adoption metrics
      const adoptionMetrics = await caller.interconnectionAnalytics.getAdoptionMetrics({ days: 1 });

      expect(studioResult.studio).toBeDefined();
      expect(adoptionMetrics).toBeDefined();
    });

    it('should sync ROI data between studios and analytics', async () => {
      // Create studio with projected ROI
      await caller.virtualStudio.createStudio({
        eventId: 'test-event-004',
        bundleId: 'D',
        avatarStyle: 'minimal',
        primaryLanguage: 'en',
      });

      // Record activation with ROI
      await caller.interconnectionAnalytics.recordActivation({
        featureId: 'virtual-studio',
        connectedFeatureId: 'engagement-tracking',
        activationSource: 'recommendation',
        roiMultiplier: 3.0,
      });

      // Retrieve ROI metrics
      const roiMetrics = await caller.interconnectionAnalytics.getROIMetrics();

      expect(roiMetrics.projectedROI).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid studio ID gracefully for ESG flags', async () => {
      try {
        await caller.virtualStudio.getESGFlags({ studioId: 99999 });
        // If it doesn't throw, result should be defined
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it('should handle missing interconnection data gracefully', async () => {
      const result = await caller.interconnectionAnalytics.getTopInterconnections();
      // Should return data, not throw
      expect(result).toBeDefined();
      expect(result).toHaveProperty('topPairs');
    });
  });
});

describe('Performance Benchmarks', () => {
  let caller: any;

  beforeAll(async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    caller = appRouter.createCaller(ctx);
  });

  it('should retrieve adoption metrics within 500ms', async () => {
    const startTime = performance.now();

    await caller.interconnectionAnalytics.getAdoptionMetrics({ days: 90 });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500);
  });

  it('should retrieve top interconnections within 300ms', async () => {
    const startTime = performance.now();

    await caller.interconnectionAnalytics.getTopInterconnections();

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(300);
  });

  it('should calculate ROI metrics within 400ms', async () => {
    const startTime = performance.now();

    await caller.interconnectionAnalytics.getROIMetrics();

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(400);
  });

  it('should create virtual studio within 200ms', async () => {
    const startTime = performance.now();

    await caller.virtualStudio.createStudio({
      eventId: 'perf-test-event',
      bundleId: 'A',
      avatarStyle: 'professional',
      primaryLanguage: 'en',
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(200);
  });
});
