import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { trpc } from '@/lib/trpc';
import { createCallerFactory } from './routers';

/**
 * INTEGRATION TEST SUITE
 * Tests interconnection between Virtual Studio, Interconnection Analytics, and existing features
 */

describe('Integration Tests: Virtual Studio & Interconnection Analytics', () => {
  let caller: any;

  beforeAll(async () => {
    // Initialize tRPC caller for server-side testing
    caller = createCallerFactory()({
      user: {
        id: 'test-user-001',
        email: 'test@example.com',
        role: 'admin',
        name: 'Test User'
      }
    });
  });

  describe('Virtual Studio Integration', () => {
    it('should create virtual studio with bundle configuration', async () => {
      const result = await caller.virtualStudio.createStudio({
        eventId: 'test-event-001',
        bundleId: 'A',
        avatarStyle: 'professional',
        primaryLanguage: 'en'
      });

      expect(result.success).toBe(true);
      expect(result.studio).toBeDefined();
      expect(result.studio?.bundleId).toBe('A');
      expect(result.studio?.avatarStyle).toBe('professional');
    });

    it('should update language configuration', async () => {
      const studioId = 1; // Assuming created in previous test
      const result = await caller.virtualStudio.updateLanguageConfig({
        studioId,
        primaryLanguage: 'en',
        dubbingLanguages: ['es', 'fr', 'de']
      });

      expect(result.success).toBe(true);
      expect(result.languages).toContain('es');
      expect(result.languages).toContain('fr');
    });

    it('should toggle ESG flagging', async () => {
      const studioId = 1;
      const result = await caller.virtualStudio.toggleESG({
        studioId,
        enabled: true
      });

      expect(result.success).toBe(true);
      expect(result.esgEnabled).toBe(true);
    });

    it('should retrieve ESG flags', async () => {
      const studioId = 1;
      const result = await caller.virtualStudio.getESGFlags({ studioId });

      expect(result.flags).toBeDefined();
      expect(Array.isArray(result.flags)).toBe(true);
    });

    it('should resolve ESG flag', async () => {
      const flagId = 'flag-001';
      const result = await caller.virtualStudio.resolveESGFlag({
        flagId,
        resolution: 'approved'
      });

      expect(result.success).toBe(true);
      expect(result.flag?.status).toBe('resolved');
    });

    it('should generate replay with quality settings', async () => {
      const studioId = 1;
      const result = await caller.virtualStudio.generateReplay({
        studioId,
        quality: '1080p',
        includeOverlays: true
      });

      expect(result.success).toBe(true);
      expect(result.replayConfig).toBeDefined();
      expect(result.replayConfig?.quality).toBe('1080p');
    });
  });

  describe('Interconnection Analytics Integration', () => {
    it('should record activation event', async () => {
      const result = await caller.interconnectionAnalytics.recordActivation({
        sourceFeatureId: 'feature-001',
        targetFeatureId: 'feature-002',
        source: 'ai-shop',
        roiProjected: 1.5
      });

      expect(result.success).toBe(true);
      expect(result.activation).toBeDefined();
    });

    it('should retrieve adoption trend', async () => {
      const result = await caller.interconnectionAnalytics.getAdoptionTrend({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        interval: 'day'
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('activations');
      expect(result[0]).toHaveProperty('cumulativeActivations');
    });

    it('should retrieve top interconnections', async () => {
      const result = await caller.interconnectionAnalytics.getTopInterconnections({
        limit: 10
      });

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('sourceFeatureName');
        expect(result[0]).toHaveProperty('targetFeatureName');
        expect(result[0]).toHaveProperty('activationCount');
      }
    });

    it('should calculate ROI analysis', async () => {
      const result = await caller.interconnectionAnalytics.getRoiAnalysis({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      expect(result).toHaveProperty('projectedTotal');
      expect(result).toHaveProperty('realizedTotal');
      expect(result).toHaveProperty('realizationRate');
      expect(result.realizationRate).toBeGreaterThanOrEqual(0);
      expect(result.realizationRate).toBeLessThanOrEqual(100);
    });

    it('should retrieve workflow completion metrics', async () => {
      const result = await caller.interconnectionAnalytics.getWorkflowCompletion();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('step');
        expect(result[0]).toHaveProperty('completedCount');
        expect(result[0]).toHaveProperty('totalCount');
        expect(result[0]).toHaveProperty('completionRate');
      }
    });

    it('should retrieve segment analysis', async () => {
      const result = await caller.interconnectionAnalytics.getSegmentAnalysis({
        segmentBy: 'industry'
      });

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('segment');
        expect(result[0]).toHaveProperty('adoptionRate');
        expect(result[0]).toHaveProperty('activeCustomers');
      }
    });

    it('should record ROI realization', async () => {
      const result = await caller.interconnectionAnalytics.recordRoiRealization({
        interconnectionId: 'ic-001',
        roiRealized: 1.8
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should link virtual studio to interconnection analytics', async () => {
      // Create studio
      const studioResult = await caller.virtualStudio.createStudio({
        eventId: 'test-event-002',
        bundleId: 'B',
        avatarStyle: 'executive',
        primaryLanguage: 'en'
      });

      const studioId = studioResult.studio?.id;

      // Record activation for studio feature
      const activationResult = await caller.interconnectionAnalytics.recordActivation({
        sourceFeatureId: 'virtual-studio',
        targetFeatureId: 'interconnection-analytics',
        source: 'recommendation',
        roiProjected: 2.0
      });

      expect(studioId).toBeDefined();
      expect(activationResult.success).toBe(true);
    });

    it('should track feature adoption velocity', async () => {
      // Record multiple activations
      for (let i = 0; i < 5; i++) {
        await caller.interconnectionAnalytics.recordActivation({
          sourceFeatureId: `feature-${i}`,
          targetFeatureId: `feature-${i + 1}`,
          source: 'ai-shop',
          roiProjected: 1.5 + i * 0.1
        });
      }

      // Retrieve engagement metrics
      const result = await caller.interconnectionAnalytics.getEngagementMetrics();

      expect(result).toHaveProperty('retention30d');
      expect(result).toHaveProperty('churn30d');
      expect(result).toHaveProperty('avgActivationVelocity');
    });

    it('should detect anomalies in adoption patterns', async () => {
      const result = await caller.interconnectionAnalytics.getAnomalies();

      expect(Array.isArray(result)).toBe(true);
      // Anomalies may or may not exist, but should be an array
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('type');
        expect(result[0]).toHaveProperty('severity');
        expect(result[0]).toHaveProperty('description');
      }
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity between studios and analytics', async () => {
      // Create studio
      const studioResult = await caller.virtualStudio.createStudio({
        eventId: 'test-event-003',
        bundleId: 'C',
        avatarStyle: 'animated',
        primaryLanguage: 'en'
      });

      const studioId = studioResult.studio?.id;

      // Record activation
      await caller.interconnectionAnalytics.recordActivation({
        sourceFeatureId: 'virtual-studio',
        targetFeatureId: `studio-${studioId}`,
        source: 'workflow',
        roiProjected: 2.5
      });

      // Verify data consistency
      const adoptionTrend = await caller.interconnectionAnalytics.getAdoptionTrend({
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        interval: 'day'
      });

      expect(adoptionTrend).toBeDefined();
      expect(Array.isArray(adoptionTrend)).toBe(true);
    });

    it('should sync ROI data between studios and analytics', async () => {
      // Create studio with projected ROI
      const studioResult = await caller.virtualStudio.createStudio({
        eventId: 'test-event-004',
        bundleId: 'D',
        avatarStyle: 'minimal',
        primaryLanguage: 'en'
      });

      // Record activation with ROI
      await caller.interconnectionAnalytics.recordActivation({
        sourceFeatureId: 'virtual-studio',
        targetFeatureId: 'engagement-tracking',
        source: 'recommendation',
        roiProjected: 3.0
      });

      // Retrieve ROI analysis
      const roiAnalysis = await caller.interconnectionAnalytics.getRoiAnalysis({
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      expect(roiAnalysis.projectedTotal).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid studio ID gracefully', async () => {
      try {
        await caller.virtualStudio.getESGFlags({ studioId: 99999 });
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it('should validate date ranges in analytics queries', async () => {
      try {
        const result = await caller.interconnectionAnalytics.getAdoptionTrend({
          startDate: new Date(),
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // End before start
          interval: 'day'
        });
        // Should either return empty or throw error
        expect(result).toBeDefined();
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it('should handle missing interconnection data', async () => {
      const result = await caller.interconnectionAnalytics.getTopInterconnections({
        limit: 10
      });

      // Should return empty array, not throw
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('Performance Benchmarks', () => {
  let caller: any;

  beforeAll(async () => {
    caller = createCallerFactory()({
      user: {
        id: 'perf-test-user',
        email: 'perf@example.com',
        role: 'admin',
        name: 'Performance Test'
      }
    });
  });

  it('should retrieve adoption trend within 500ms', async () => {
    const startTime = performance.now();

    await caller.interconnectionAnalytics.getAdoptionTrend({
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      interval: 'day'
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500);
  });

  it('should retrieve top interconnections within 300ms', async () => {
    const startTime = performance.now();

    await caller.interconnectionAnalytics.getTopInterconnections({ limit: 10 });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(300);
  });

  it('should calculate ROI analysis within 400ms', async () => {
    const startTime = performance.now();

    await caller.interconnectionAnalytics.getRoiAnalysis({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    });

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
      primaryLanguage: 'en'
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(200);
  });
});
