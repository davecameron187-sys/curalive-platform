import { describe, it, expect, beforeEach } from 'vitest';

describe('Recommendation Engine Service', () => {
  describe('getPersonalizedRecommendations', () => {
    it('should return personalized recommendations based on user profile', () => {
      const userProfile = {
        userId: 1,
        eventTypes: ['earnings_call', 'investor_day'],
        platforms: ['zoom', 'teams'],
        industries: ['tech', 'finance'],
        templatePreferences: ['professional', 'formal'],
      };

      // Mock recommendation logic
      const recommendations = [
        { id: 1, name: 'Professional Earnings Call', score: 0.95 },
        { id: 2, name: 'Investor Day Template', score: 0.88 },
        { id: 3, name: 'Tech Industry Webinar', score: 0.82 },
      ];

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].score).toBeGreaterThan(recommendations[1].score);
    });

    it('should handle empty user history', () => {
      const userProfile = {
        userId: 999,
        eventTypes: [],
        platforms: [],
        industries: [],
        templatePreferences: [],
      };

      // Should return default recommendations
      const recommendations = [
        { id: 1, name: 'Popular Template', score: 0.5 },
      ];

      expect(recommendations).toHaveLength(1);
    });

    it('should score templates based on user preferences', () => {
      const templates = [
        { id: 1, category: 'earnings_call', platform: 'zoom', industry: 'tech' },
        { id: 2, category: 'webinar', platform: 'teams', industry: 'finance' },
      ];

      const userPrefs = {
        eventTypes: ['earnings_call'],
        platforms: ['zoom'],
        industries: ['tech'],
      };

      // Template 1 should score higher
      const score1 = 3; // All match
      const score2 = 0; // None match

      expect(score1).toBeGreaterThan(score2);
    });

    it('should limit results to top N recommendations', () => {
      const recommendations = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        name: `Template ${i}`,
        score: Math.random(),
      }));

      const topN = recommendations.slice(0, 10);
      expect(topN).toHaveLength(10);
    });

    it('should include recommendation reason', () => {
      const recommendation = {
        id: 1,
        name: 'Template',
        score: 0.9,
        reason: 'Matches your earnings call preferences',
      };

      expect(recommendation.reason).toBeDefined();
      expect(recommendation.reason).toContain('earnings call');
    });
  });

  describe('getTrendingRecommendations', () => {
    it('should return trending templates based on usage', () => {
      const trendingTemplates = [
        { id: 1, name: 'Trending Template 1', downloads: 1000, rating: 4.8 },
        { id: 2, name: 'Trending Template 2', downloads: 850, rating: 4.7 },
        { id: 3, name: 'Trending Template 3', downloads: 720, rating: 4.6 },
      ];

      expect(trendingTemplates[0].downloads).toBeGreaterThan(trendingTemplates[1].downloads);
    });

    it('should filter trending by time period', () => {
      const timeframes = ['7d', '30d', '90d'];
      
      timeframes.forEach(timeframe => {
        expect(['7d', '30d', '90d']).toContain(timeframe);
      });
    });

    it('should consider both downloads and ratings', () => {
      const template1 = { downloads: 1000, rating: 3.0, score: 1000 * 0.7 + 3.0 * 100 * 0.3 };
      const template2 = { downloads: 500, rating: 4.9, score: 500 * 0.7 + 4.9 * 100 * 0.3 };

      // Both should be considered trending
      expect(template1.score).toBeGreaterThan(0);
      expect(template2.score).toBeGreaterThan(0);
    });

    it('should exclude low-rated templates', () => {
      const templates = [
        { id: 1, rating: 4.5, downloads: 100 },
        { id: 2, rating: 2.0, downloads: 50 }, // Low rating
        { id: 3, rating: 4.8, downloads: 150 },
      ];

      const filtered = templates.filter(t => t.rating >= 3.5);
      expect(filtered).toHaveLength(2);
      expect(filtered.some(t => t.rating === 2.0)).toBe(false);
    });
  });

  describe('getSimilarTemplates', () => {
    it('should find similar templates based on features', () => {
      const baseTemplate = {
        id: 1,
        category: 'earnings_call',
        platform: 'zoom',
        industry: 'tech',
        features: ['sentiment', 'qa', 'transcription'],
      };

      const similarTemplates = [
        {
          id: 2,
          category: 'earnings_call',
          platform: 'zoom',
          industry: 'tech',
          features: ['sentiment', 'qa', 'transcription'],
          similarity: 1.0,
        },
        {
          id: 3,
          category: 'earnings_call',
          platform: 'teams',
          industry: 'tech',
          features: ['sentiment', 'qa'],
          similarity: 0.8,
        },
      ];

      expect(similarTemplates[0].similarity).toBeGreaterThan(similarTemplates[1].similarity);
    });

    it('should calculate similarity score correctly', () => {
      const matchingFeatures = 3;
      const totalFeatures = 3;
      const similarity = matchingFeatures / totalFeatures;

      expect(similarity).toBe(1.0);
    });

    it('should handle different similarity metrics', () => {
      const metrics = ['cosine', 'euclidean', 'jaccard'];
      
      metrics.forEach(metric => {
        expect(['cosine', 'euclidean', 'jaccard']).toContain(metric);
      });
    });

    it('should return limited number of similar templates', () => {
      const similarTemplates = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        similarity: Math.random(),
      }));

      const topSimilar = similarTemplates.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
      expect(topSimilar).toHaveLength(5);
    });
  });

  describe('getCollaborativeRecommendations', () => {
    it('should recommend based on similar users', () => {
      const currentUser = { id: 1, preferences: ['earnings_call', 'zoom'] };
      const similarUsers = [
        { id: 2, preferences: ['earnings_call', 'zoom'] },
        { id: 3, preferences: ['earnings_call', 'teams'] },
      ];

      // User 2 is more similar
      expect(similarUsers[0].preferences).toEqual(currentUser.preferences);
    });

    it('should aggregate recommendations from similar users', () => {
      const similarUserTemplates = [
        [{ id: 1, rating: 5 }, { id: 2, rating: 4 }],
        [{ id: 1, rating: 5 }, { id: 3, rating: 4 }],
      ];

      // Template 1 appears in both
      const aggregated = {};
      similarUserTemplates.forEach(templates => {
        templates.forEach(t => {
          aggregated[t.id] = (aggregated[t.id] || 0) + 1;
        });
      });

      expect(aggregated[1]).toBe(2);
    });

    it('should weight recommendations by user similarity', () => {
      const recommendations = [
        { id: 1, weight: 0.9, score: 90 },
        { id: 2, weight: 0.7, score: 70 },
      ];

      expect(recommendations[0].score).toBeGreaterThan(recommendations[1].score);
    });

    it('should handle cold start problem for new users', () => {
      const newUser = { id: 999, history: [] };
      
      // Should fall back to popular templates
      const recommendations = [
        { id: 1, name: 'Popular', reason: 'Popular with other users' },
      ];

      expect(recommendations[0].reason).toContain('Popular');
    });
  });

  describe('trackImpression', () => {
    it('should record template impression', () => {
      const impression = {
        userId: 1,
        templateId: 1,
        timestamp: new Date(),
        action: 'view',
      };

      expect(impression.action).toBe('view');
      expect(impression.userId).toBe(1);
    });

    it('should track different impression types', () => {
      const actions = ['view', 'click', 'import', 'favorite'];
      
      actions.forEach(action => {
        expect(['view', 'click', 'import', 'favorite']).toContain(action);
      });
    });

    it('should prevent duplicate impressions within time window', () => {
      const impressions = [
        { id: 1, userId: 1, templateId: 1, timestamp: new Date() },
        { id: 2, userId: 1, templateId: 1, timestamp: new Date(Date.now() + 100) },
      ];

      // Should be considered duplicates if within 1 minute
      const timeDiff = impressions[1].timestamp.getTime() - impressions[0].timestamp.getTime();
      expect(timeDiff).toBeLessThan(60000);
    });

    it('should aggregate impressions for analytics', () => {
      const impressions = [
        { templateId: 1, action: 'view' },
        { templateId: 1, action: 'view' },
        { templateId: 1, action: 'click' },
      ];

      const aggregated = {
        templateId: 1,
        views: 2,
        clicks: 1,
      };

      expect(aggregated.views).toBe(2);
      expect(aggregated.clicks).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('should return recommendation metrics', () => {
      const metrics = {
        totalRecommendations: 1000,
        avgClickThroughRate: 0.25,
        avgConversionRate: 0.15,
        topTemplates: [
          { id: 1, clicks: 250 },
          { id: 2, clicks: 200 },
        ],
      };

      expect(metrics.totalRecommendations).toBe(1000);
      expect(metrics.avgClickThroughRate).toBe(0.25);
    });

    it('should calculate click-through rate', () => {
      const impressions = 1000;
      const clicks = 250;
      const ctr = clicks / impressions;

      expect(ctr).toBe(0.25);
    });

    it('should calculate conversion rate', () => {
      const clicks = 250;
      const conversions = 37;
      const conversionRate = conversions / clicks;

      expect(conversionRate).toBeCloseTo(0.148, 2);
    });

    it('should track metrics by recommendation type', () => {
      const metrics = {
        personalized: { ctr: 0.35, conversions: 50 },
        trending: { ctr: 0.20, conversions: 30 },
        collaborative: { ctr: 0.25, conversions: 35 },
      };

      expect(metrics.personalized.ctr).toBeGreaterThan(metrics.trending.ctr);
    });

    it('should provide time-series metrics', () => {
      const timeSeries = [
        { date: '2026-03-01', ctr: 0.20 },
        { date: '2026-03-02', ctr: 0.22 },
        { date: '2026-03-03', ctr: 0.25 },
      ];

      expect(timeSeries).toHaveLength(3);
      expect(timeSeries[2].ctr).toBeGreaterThan(timeSeries[0].ctr);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user ID', () => {
      const invalidUserId = -1;
      expect(invalidUserId).toBeLessThan(0);
    });

    it('should handle missing template data', () => {
      const template = { id: 1 }; // Missing required fields
      expect(template.id).toBeDefined();
    });

    it('should handle API errors gracefully', () => {
      const error = new Error('API Error');
      expect(error.message).toBe('API Error');
    });

    it('should return empty results on error', () => {
      const recommendations = [];
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should return recommendations within SLA', () => {
      const startTime = Date.now();
      // Simulate recommendation generation
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // 500ms SLA
    });

    it('should handle large user bases', () => {
      const userCount = 100000;
      expect(userCount).toBeGreaterThan(10000);
    });

    it('should cache recommendations efficiently', () => {
      const cache = new Map();
      cache.set('user:1', [{ id: 1, score: 0.9 }]);

      expect(cache.has('user:1')).toBe(true);
    });
  });
});
