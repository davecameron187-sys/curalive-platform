/**
 * Alert Template Marketplace Service
 * Community template sharing, rating, and import
 */

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  author: string;
  authorId: string;
  category: string;
  tags: string[];
  alertType: "escalation" | "correlation" | "maintenance" | "custom";
  integrationType: string;
  templateBody: string;
  templateSubject?: string;
  variables: string[];
  version: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  license: "MIT" | "Apache-2.0" | "GPL-3.0" | "Proprietary";
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: Date;
}

export interface TemplateImportResult {
  success: boolean;
  templateId?: string;
  templateName?: string;
  message: string;
  warnings?: string[];
}

export class TemplateMarketplaceService {
  private templates: Map<string, MarketplaceTemplate> = new Map();
  private reviews: Map<string, TemplateReview[]> = new Map();
  private downloads: Map<string, number> = new Map();

  constructor() {
    this.initializeMarketplaceTemplates();
  }

  /**
   * Initialize marketplace with sample templates
   */
  private initializeMarketplaceTemplates(): void {
    const sampleTemplates: MarketplaceTemplate[] = [
      {
        id: "marketplace-pagerduty-escalation",
        name: "PagerDuty Escalation",
        description: "Professional escalation template for PagerDuty integration",
        author: "Chorus.AI Team",
        authorId: "system",
        category: "Escalation",
        tags: ["pagerduty", "escalation", "critical"],
        alertType: "escalation",
        integrationType: "pagerduty",
        templateBody:
          "Incident: {{title}}\nSeverity: {{severity}}\nLocation: {{location}}\nAffected Kiosks: {{affectedCount}}\nAction: {{actionUrl}}",
        templateSubject: "ALERT: {{title}} - {{severity}}",
        variables: ["title", "severity", "location", "affectedCount", "actionUrl"],
        version: "1.0.0",
        downloads: 1250,
        rating: 4.8,
        reviewCount: 45,
        isPublic: true,
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-03-01"),
        license: "MIT",
      },
      {
        id: "marketplace-slack-correlation",
        name: "Slack Correlation Alert",
        description: "Formatted correlation alert for Slack channels",
        author: "Community Contributor",
        authorId: "user-12345",
        category: "Correlation",
        tags: ["slack", "correlation", "systemic"],
        alertType: "correlation",
        integrationType: "slack",
        templateBody:
          ":warning: *Systemic Issue Detected*\nEvent: {{eventId}}\nAffected Kiosks: {{affectedCount}}\nConfidence: {{confidence}}%\nAction Required: {{actionUrl}}",
        variables: ["eventId", "affectedCount", "confidence", "actionUrl"],
        version: "1.2.0",
        downloads: 890,
        rating: 4.6,
        reviewCount: 32,
        isPublic: true,
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-02-28"),
        license: "Apache-2.0",
      },
      {
        id: "marketplace-email-summary",
        name: "Daily Email Summary",
        description: "Daily digest email template for alert summaries",
        author: "Chorus.AI Team",
        authorId: "system",
        category: "Summary",
        tags: ["email", "daily", "summary"],
        alertType: "custom",
        integrationType: "email",
        templateBody:
          "Daily Alert Summary\n\nTotal Alerts: {{totalAlerts}}\nCritical: {{criticalCount}}\nWarning: {{warningCount}}\n\nTop Issue: {{topIssue}}\nResolution Rate: {{resolutionRate}}%\n\nView Details: {{dashboardUrl}}",
        templateSubject: "Daily Alert Summary - {{date}}",
        variables: [
          "totalAlerts",
          "criticalCount",
          "warningCount",
          "topIssue",
          "resolutionRate",
          "dashboardUrl",
          "date",
        ],
        version: "1.1.0",
        downloads: 650,
        rating: 4.5,
        reviewCount: 28,
        isPublic: true,
        createdAt: new Date("2026-01-20"),
        updatedAt: new Date("2026-03-05"),
        license: "MIT",
      },
    ];

    sampleTemplates.forEach((template) => {
      this.templates.set(template.id, template);
      this.downloads.set(template.id, template.downloads);
    });
  }

  /**
   * Search marketplace templates
   */
  searchTemplates(
    query: string,
    filters?: {
      category?: string;
      alertType?: string;
      integrationType?: string;
      minRating?: number;
      tags?: string[];
    }
  ): MarketplaceTemplate[] {
    let results = Array.from(this.templates.values()).filter(
      (t) => t.isPublic
    );

    // Filter by search query
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Apply filters
    if (filters?.category) {
      results = results.filter((t) => t.category === filters.category);
    }
    if (filters?.alertType) {
      results = results.filter((t) => t.alertType === filters.alertType);
    }
    if (filters?.integrationType) {
      results = results.filter(
        (t) => t.integrationType === filters.integrationType
      );
    }
    if (filters?.minRating) {
      results = results.filter((t) => t.rating >= filters.minRating!);
    }
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter((t) =>
        filters.tags!.some((tag) => t.tags.includes(tag))
      );
    }

    // Sort by rating and downloads
    return results.sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      if (ratingDiff !== 0) return ratingDiff;
      return b.downloads - a.downloads;
    });
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): MarketplaceTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Get featured templates
   */
  getFeaturedTemplates(limit: number = 6): MarketplaceTemplate[] {
    return Array.from(this.templates.values())
      .filter((t) => t.isPublic)
      .sort((a, b) => {
        const scoreA = a.rating * a.reviewCount + a.downloads;
        const scoreB = b.rating * b.reviewCount + b.downloads;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get trending templates
   */
  getTrendingTemplates(limit: number = 6): MarketplaceTemplate[] {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return Array.from(this.templates.values())
      .filter((t) => t.isPublic && t.updatedAt > weekAgo)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): MarketplaceTemplate[] {
    return Array.from(this.templates.values())
      .filter((t) => t.isPublic && t.category === category)
      .sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get templates by author
   */
  getTemplatesByAuthor(authorId: string): MarketplaceTemplate[] {
    return Array.from(this.templates.values())
      .filter((t) => t.authorId === authorId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Publish a template to marketplace
   */
  publishTemplate(
    template: Omit<MarketplaceTemplate, "id" | "downloads" | "createdAt">
  ): MarketplaceTemplate {
    const id = `marketplace-${Date.now()}`;
    const published: MarketplaceTemplate = {
      ...template,
      id,
      downloads: 0,
      createdAt: new Date(),
    };

    this.templates.set(id, published);
    this.downloads.set(id, 0);
    return published;
  }

  /**
   * Import template from marketplace
   */
  importTemplate(
    templateId: string,
    userId: string
  ): TemplateImportResult {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        success: false,
        message: "Template not found in marketplace",
      };
    }

    // Increment download count
    const currentDownloads = this.downloads.get(templateId) || 0;
    this.downloads.set(templateId, currentDownloads + 1);

    // Update template downloads
    template.downloads = currentDownloads + 1;

    const warnings: string[] = [];

    // Validate variables
    if (template.variables.length === 0) {
      warnings.push("Template has no variables defined");
    }

    // Check for deprecated integrations
    if (
      template.integrationType === "legacy-slack" ||
      template.integrationType === "legacy-teams"
    ) {
      warnings.push(
        `Integration type "${template.integrationType}" is deprecated`
      );
    }

    return {
      success: true,
      templateId: `imported-${templateId}-${Date.now()}`,
      templateName: template.name,
      message: `Successfully imported "${template.name}" template`,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Add review to template
   */
  addReview(
    templateId: string,
    userId: string,
    userName: string,
    rating: number,
    comment: string
  ): TemplateReview | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const review: TemplateReview = {
      id: `review-${Date.now()}`,
      templateId,
      userId,
      userName,
      rating: Math.max(1, Math.min(5, rating)),
      comment,
      helpful: 0,
      createdAt: new Date(),
    };

    if (!this.reviews.has(templateId)) {
      this.reviews.set(templateId, []);
    }

    this.reviews.get(templateId)!.push(review);

    // Update template rating
    const allReviews = this.reviews.get(templateId)!;
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    template.rating = Math.round(avgRating * 10) / 10;
    template.reviewCount = allReviews.length;

    return review;
  }

  /**
   * Get reviews for template
   */
  getReviews(templateId: string): TemplateReview[] {
    return this.reviews.get(templateId) || [];
  }

  /**
   * Get categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.templates.forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  }

  /**
   * Get all tags
   */
  getAllTags(): { tag: string; count: number }[] {
    const tagCounts = new Map<string, number>();

    this.templates.forEach((t) => {
      t.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get marketplace statistics
   */
  getStatistics(): {
    totalTemplates: number;
    totalDownloads: number;
    averageRating: number;
    categories: number;
    tags: number;
  } {
    const templates = Array.from(this.templates.values());
    const totalDownloads = Array.from(this.downloads.values()).reduce(
      (sum, d) => sum + d,
      0
    );
    const averageRating =
      templates.length > 0
        ? Math.round(
            (templates.reduce((sum, t) => sum + t.rating, 0) /
              templates.length) *
              10
          ) / 10
        : 0;

    const categories = new Set(templates.map((t) => t.category)).size;
    const tags = new Set<string>();
    templates.forEach((t) => t.tags.forEach((tag) => tags.add(tag)));

    return {
      totalTemplates: templates.length,
      totalDownloads,
      averageRating,
      categories,
      tags: tags.size,
    };
  }

  /**
   * Report template as inappropriate
   */
  reportTemplate(templateId: string, reason: string, userId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    // In real implementation, save report to database
    console.log(`Template ${templateId} reported by ${userId}: ${reason}`);
    return true;
  }

  /**
   * Get similar templates
   */
  getSimilarTemplates(templateId: string, limit: number = 5): MarketplaceTemplate[] {
    const template = this.templates.get(templateId);
    if (!template) return [];

    const similar = Array.from(this.templates.values())
      .filter((t) => t.id !== templateId && t.isPublic)
      .map((t) => {
        let score = 0;

        // Same category
        if (t.category === template.category) score += 3;

        // Same alert type
        if (t.alertType === template.alertType) score += 2;

        // Same integration type
        if (t.integrationType === template.integrationType) score += 2;

        // Shared tags
        const sharedTags = t.tags.filter((tag) =>
          template.tags.includes(tag)
        ).length;
        score += sharedTags;

        return { template: t, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.template);

    return similar;
  }
}

// Export singleton instance
export const templateMarketplaceService = new TemplateMarketplaceService();
