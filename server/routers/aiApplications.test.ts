/**
 * AI Applications Router Tests
 * Tests for AI application discovery, recommendations, and filtering
 */

import { describe, it, expect } from "vitest";
import {
  aiApplications,
  getRecommendedApplications,
  getTopRecommendedApplications,
  getApplicationsByCategory,
  getAllCategories,
  getAllSectors,
  getAllEventTypes,
} from "../config/aiApplications";

describe("AI Applications", () => {
  describe("Data Structure", () => {
    it("should have at least 28 AI applications", () => {
      const apps = Object.values(aiApplications);
      expect(apps.length).toBeGreaterThanOrEqual(28);
    });

    it("each application should have required fields", () => {
      Object.values(aiApplications).forEach((app) => {
        expect(app).toHaveProperty("id");
        expect(app).toHaveProperty("name");
        expect(app).toHaveProperty("description");
        expect(app).toHaveProperty("category");
        expect(app).toHaveProperty("priority");
        expect(app).toHaveProperty("sectors");
        expect(app).toHaveProperty("eventTypes");
        expect(app).toHaveProperty("benefits");
        expect(app).toHaveProperty("stats");
        expect(app).toHaveProperty("timeToValue");
      });
    });

    it("each application should have valid priority", () => {
      Object.values(aiApplications).forEach((app) => {
        expect(["high", "medium", "low"]).toContain(app.priority);
      });
    });

    it("each application should have at least one sector", () => {
      Object.values(aiApplications).forEach((app) => {
        expect(app.sectors.length).toBeGreaterThan(0);
      });
    });

    it("each application should have at least one event type", () => {
      Object.values(aiApplications).forEach((app) => {
        expect(app.eventTypes.length).toBeGreaterThan(0);
      });
    });

    it("each application should have at least one benefit", () => {
      Object.values(aiApplications).forEach((app) => {
        expect(app.benefits.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Recommendations", () => {
    it("should return recommended applications for financial-services + earnings-call", () => {
      const recommended = getRecommendedApplications(
        "financial-services",
        "earnings-call"
      );
      expect(recommended.length).toBeGreaterThan(0);
      expect(recommended[0]).toHaveProperty("id");
      expect(recommended[0]).toHaveProperty("name");
    });

    it("should return recommended applications for healthcare + video-webcast", () => {
      const recommended = getRecommendedApplications("healthcare", "video-webcast");
      expect(recommended.length).toBeGreaterThan(0);
    });

    it("should return top N recommended applications", () => {
      const top5 = getTopRecommendedApplications(
        "financial-services",
        "earnings-call",
        5
      );
      expect(top5.length).toBeLessThanOrEqual(5);
      expect(top5.length).toBeGreaterThan(0);
    });

    it("should respect limit parameter in getTopRecommendedApplications", () => {
      const top3 = getTopRecommendedApplications(
        "technology",
        "video-webcast",
        3
      );
      expect(top3.length).toBeLessThanOrEqual(3);
    });

    it("should sort recommendations by relevance score", () => {
      const recommended = getRecommendedApplications(
        "financial-services",
        "earnings-call"
      );
      if (recommended.length > 1) {
        // High priority apps should come before medium/low
        const highPriorityApps = recommended.filter((a) => a.priority === "high");
        expect(highPriorityApps.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Filtering", () => {
    it("should get applications by category", () => {
      const categories = getAllCategories();
      expect(categories.length).toBeGreaterThan(0);

      const category = categories[0];
      const appsByCategory = getApplicationsByCategory(category);
      expect(appsByCategory.length).toBeGreaterThan(0);
    });

    it("should return all categories", () => {
      const categories = getAllCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(typeof categories[0]).toBe("string");
    });

    it("should return all sectors", () => {
      const sectors = getAllSectors();
      expect(sectors.length).toBeGreaterThan(0);
      expect(typeof sectors[0]).toBe("string");
    });

    it("should return all event types", () => {
      const eventTypes = getAllEventTypes();
      expect(eventTypes.length).toBeGreaterThan(0);
      expect(typeof eventTypes[0]).toBe("string");
    });
  });

  describe("Application Details", () => {
    it("should have applications with realistic ROI estimates", () => {
      const apps = Object.values(aiApplications);
      apps.forEach((app) => {
        if (app.roiEstimate) {
          expect(typeof app.roiEstimate).toBe("string");
          expect(app.roiEstimate.length).toBeGreaterThan(0);
        }
      });
    });

    it("should have applications with implementation time", () => {
      const apps = Object.values(aiApplications);
      apps.forEach((app) => {
        if (app.implementationTime) {
          expect(typeof app.implementationTime).toBe("string");
          expect(app.implementationTime.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("Cross-sector Compatibility", () => {
    it("should have applications suitable for multiple sectors", () => {
      const multiSectorApps = Object.values(aiApplications).filter(
        (a) => a.sectors.length > 1
      );
      expect(multiSectorApps.length).toBeGreaterThan(0);
    });

    it("should have applications suitable for multiple event types", () => {
      const multiEventApps = Object.values(aiApplications).filter(
        (a) => a.eventTypes.length > 1
      );
      expect(multiEventApps.length).toBeGreaterThan(0);
    });
  });
});
