/**
 * Round 67 Comprehensive Tests
 * Template Preview, Audit Retention, Marketplace
 */
import { describe, it, expect, beforeEach } from "vitest";
import { AuditLogRetentionService } from "@/server/services/auditLogRetention";
import { TemplateMarketplaceService } from "@/server/services/templateMarketplace";

describe("Round 67 Template & Marketplace Features", () => {
  describe("Audit Log Retention Service", () => {
    let service: AuditLogRetentionService;

    beforeEach(() => {
      service = new AuditLogRetentionService();
    });

    it("should initialize with default policies", () => {
      const policies = service.getAllPolicies();
      expect(policies.length).toBeGreaterThan(0);
      expect(policies.some((p) => p.retentionDays === 90)).toBe(true);
    });

    it("should create a new retention policy", () => {
      const policy = service.createPolicy(
        "Test Policy",
        45,
        "alerts",
        "Test description"
      );

      expect(policy.id).toBeDefined();
      expect(policy.name).toBe("Test Policy");
      expect(policy.retentionDays).toBe(45);
      expect(policy.logType).toBe("alerts");
      expect(policy.enabled).toBe(true);
    });

    it("should update an existing policy", () => {
      const policy = service.createPolicy("Original", 30, "all");
      const updated = service.updatePolicy(policy.id, {
        name: "Updated",
        retentionDays: 60,
      });

      expect(updated?.name).toBe("Updated");
      expect(updated?.retentionDays).toBe(60);
    });

    it("should delete a policy", () => {
      const policy = service.createPolicy("To Delete", 30, "all");
      const deleted = service.deletePolicy(policy.id);

      expect(deleted).toBe(true);
      expect(service.getPolicy(policy.id)).toBeNull();
    });

    it("should get enabled policies", () => {
      const enabled = service.getEnabledPolicies();
      expect(enabled.every((p) => p.enabled)).toBe(true);
    });

    it("should schedule cleanup job", () => {
      const policy = service.createPolicy("Scheduled", 30, "all");
      const schedule = service.scheduleCleanup(policy.id, "0 2 * * *");

      expect(schedule).not.toBeNull();
      expect(schedule?.policyId).toBe(policy.id);
      expect(schedule?.cronExpression).toBe("0 2 * * *");
      expect(schedule?.isActive).toBe(true);
    });

    it("should execute cleanup", async () => {
      const policy = service.createPolicy("Cleanup Test", 30, "all");
      const result = await service.executeCleanup(policy.id);

      expect(result.success).toBe(true);
      expect(result.policyId).toBe(policy.id);
      expect(result.logsDeleted).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("should get cleanup history", async () => {
      const policy = service.createPolicy("History Test", 30, "all");
      await service.executeCleanup(policy.id);
      await service.executeCleanup(policy.id);

      const history = service.getCleanupHistory(policy.id);
      expect(history.length).toBe(2);
    });

    it("should get cleanup statistics", async () => {
      const policy = service.createPolicy("Stats Test", 30, "all");
      await service.executeCleanup(policy.id);

      const stats = service.getCleanupStatistics();
      expect(stats.totalCleanups).toBeGreaterThan(0);
      expect(stats.successfulCleanups).toBeGreaterThanOrEqual(0);
      expect(stats.totalLogsDeleted).toBeGreaterThanOrEqual(0);
    });

    it("should pause and resume schedule", () => {
      const policy = service.createPolicy("Pause Test", 30, "all");
      service.scheduleCleanup(policy.id);

      const paused = service.pauseSchedule(policy.id);
      expect(paused).toBe(true);

      const resumed = service.resumeSchedule(policy.id);
      expect(resumed).toBe(true);
    });

    it("should get compliance status", () => {
      const status = service.getComplianceStatus();
      expect(Array.isArray(status)).toBe(true);
      expect(status.every((s) => s.policyId && s.status)).toBe(true);
    });

    it("should estimate logs to delete", () => {
      const policy = service.createPolicy("Estimate Test", 30, "all");
      const estimate = service.estimateLogsToDelete(policy.id);

      expect(typeof estimate).toBe("number");
      expect(estimate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Template Marketplace Service", () => {
    let service: TemplateMarketplaceService;

    beforeEach(() => {
      service = new TemplateMarketplaceService();
    });

    it("should initialize with sample templates", () => {
      const templates = service.searchTemplates("");
      expect(templates.length).toBeGreaterThan(0);
    });

    it("should search templates by query", () => {
      const results = service.searchTemplates("PagerDuty");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain("PagerDuty");
    });

    it("should filter templates by category", () => {
      const results = service.searchTemplates("", { category: "Escalation" });
      expect(results.every((t) => t.category === "Escalation")).toBe(true);
    });

    it("should filter templates by alert type", () => {
      const results = service.searchTemplates("", {
        alertType: "escalation",
      });
      expect(results.every((t) => t.alertType === "escalation")).toBe(true);
    });

    it("should filter templates by integration type", () => {
      const results = service.searchTemplates("", {
        integrationType: "pagerduty",
      });
      expect(results.every((t) => t.integrationType === "pagerduty")).toBe(
        true
      );
    });

    it("should filter templates by minimum rating", () => {
      const results = service.searchTemplates("", { minRating: 4.5 });
      expect(results.every((t) => t.rating >= 4.5)).toBe(true);
    });

    it("should filter templates by tags", () => {
      const results = service.searchTemplates("", {
        tags: ["pagerduty"],
      });
      expect(results.every((t) => t.tags.includes("pagerduty"))).toBe(true);
    });

    it("should get template by ID", () => {
      const template = service.getTemplate("marketplace-pagerduty-escalation");
      expect(template).not.toBeNull();
      expect(template?.name).toBe("PagerDuty Escalation");
    });

    it("should get featured templates", () => {
      const featured = service.getFeaturedTemplates(3);
      expect(featured.length).toBeGreaterThan(0);
      expect(featured.length).toBeLessThanOrEqual(3);
    });

    it("should get trending templates", () => {
      const trending = service.getTrendingTemplates(3);
      expect(Array.isArray(trending)).toBe(true);
    });

    it("should get templates by category", () => {
      const templates = service.getTemplatesByCategory("Escalation");
      expect(templates.every((t) => t.category === "Escalation")).toBe(true);
    });

    it("should get templates by author", () => {
      const templates = service.getTemplatesByAuthor("system");
      expect(templates.every((t) => t.authorId === "system")).toBe(true);
    });

    it("should publish a template", () => {
      const published = service.publishTemplate({
        name: "Test Template",
        description: "Test description",
        author: "Test Author",
        authorId: "test-user",
        category: "Custom",
        tags: ["test"],
        alertType: "custom",
        integrationType: "custom",
        templateBody: "Test body",
        variables: ["var1", "var2"],
        version: "1.0.0",
        rating: 0,
        reviewCount: 0,
        isPublic: true,
        updatedAt: new Date(),
        license: "MIT",
      });

      expect(published.id).toBeDefined();
      expect(published.name).toBe("Test Template");
      expect(published.downloads).toBe(0);
    });

    it("should import template from marketplace", () => {
      const result = service.importTemplate(
        "marketplace-pagerduty-escalation",
        "user-123"
      );

      expect(result.success).toBe(true);
      expect(result.templateId).toBeDefined();
      expect(result.templateName).toBe("PagerDuty Escalation");
    });

    it("should increment download count on import", () => {
      const before = service.getTemplate(
        "marketplace-pagerduty-escalation"
      )?.downloads;
      service.importTemplate("marketplace-pagerduty-escalation", "user-123");
      const after = service.getTemplate(
        "marketplace-pagerduty-escalation"
      )?.downloads;

      expect(after).toBe((before || 0) + 1);
    });

    it("should add review to template", () => {
      const review = service.addReview(
        "marketplace-pagerduty-escalation",
        "user-123",
        "John Doe",
        5,
        "Great template!"
      );

      expect(review).not.toBeNull();
      expect(review?.rating).toBe(5);
      expect(review?.comment).toBe("Great template!");
    });

    it("should get reviews for template", () => {
      service.addReview(
        "marketplace-pagerduty-escalation",
        "user-123",
        "John",
        5,
        "Great!"
      );
      service.addReview(
        "marketplace-pagerduty-escalation",
        "user-456",
        "Jane",
        4,
        "Good!"
      );

      const reviews = service.getReviews("marketplace-pagerduty-escalation");
      expect(reviews.length).toBe(2);
    });

    it("should update template rating based on reviews", () => {
      const before = service.getTemplate(
        "marketplace-pagerduty-escalation"
      )?.rating;

      service.addReview(
        "marketplace-pagerduty-escalation",
        "user-123",
        "John",
        5,
        "Excellent!"
      );

      const after = service.getTemplate(
        "marketplace-pagerduty-escalation"
      )?.rating;

      expect(after).not.toBe(before);
    });

    it("should get categories", () => {
      const categories = service.getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it("should get all tags", () => {
      const tags = service.getAllTags();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.every((t) => t.tag && t.count > 0)).toBe(true);
    });

    it("should get marketplace statistics", () => {
      const stats = service.getStatistics();

      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(stats.totalDownloads).toBeGreaterThanOrEqual(0);
      expect(stats.averageRating).toBeGreaterThan(0);
      expect(stats.categories).toBeGreaterThan(0);
      expect(stats.tags).toBeGreaterThan(0);
    });

    it("should report template", () => {
      const reported = service.reportTemplate(
        "marketplace-pagerduty-escalation",
        "Inappropriate content",
        "user-123"
      );

      expect(reported).toBe(true);
    });

    it("should get similar templates", () => {
      const similar = service.getSimilarTemplates(
        "marketplace-pagerduty-escalation",
        3
      );

      expect(Array.isArray(similar)).toBe(true);
    });

    it("should handle invalid template import", () => {
      const result = service.importTemplate("invalid-id", "user-123");

      expect(result.success).toBe(false);
      expect(result.message).toContain("not found");
    });

    it("should validate rating bounds", () => {
      const review = service.addReview(
        "marketplace-pagerduty-escalation",
        "user-123",
        "John",
        10,
        "Test"
      );

      expect(review?.rating).toBeLessThanOrEqual(5);
      expect(review?.rating).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete retention workflow", async () => {
      const service = new AuditLogRetentionService();

      // Create policy
      const policy = service.createPolicy("Integration Test", 30, "all");
      expect(policy.id).toBeDefined();

      // Schedule cleanup
      const schedule = service.scheduleCleanup(policy.id);
      expect(schedule?.isActive).toBe(true);

      // Execute cleanup
      const result = await service.executeCleanup(policy.id);
      expect(result.success).toBe(true);

      // Get statistics
      const stats = service.getCleanupStatistics();
      expect(stats.totalCleanups).toBeGreaterThan(0);
    });

    it("should handle complete marketplace workflow", () => {
      const service = new TemplateMarketplaceService();

      // Search templates
      const results = service.searchTemplates("PagerDuty");
      expect(results.length).toBeGreaterThan(0);

      // Get template details
      const template = service.getTemplate(results[0].id);
      expect(template).not.toBeNull();

      // Add review
      const review = service.addReview(
        template!.id,
        "user-123",
        "John",
        5,
        "Excellent!"
      );
      expect(review).not.toBeNull();

      // Import template
      const imported = service.importTemplate(template!.id, "user-456");
      expect(imported.success).toBe(true);

      // Get similar templates
      const similar = service.getSimilarTemplates(template!.id);
      expect(Array.isArray(similar)).toBe(true);
    });
  });
});
