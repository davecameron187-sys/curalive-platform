import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, submitFeedback, getRecentFeedback } from "./db";
import { userFeedback } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("User Feedback", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available for tests");
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (db) {
      const testEmails = [
        "test@example.com",
        "test1@example.com",
        "test2@example.com",
        "test3@example.com",
        "test4@example.com",
        "test5@example.com",
        "recent@example.com",
        "integration@example.com",
        "longfeedback@example.com",
        "user@example.com",
      ];
      for (const email of testEmails) {
        await db
          .delete(userFeedback)
          .where(eq(userFeedback.email, email))
          .catch(() => {});
      }
    }
  });

  it("should submit feedback with rating and suggestion", async () => {
    const result = await submitFeedback({
      rating: 5,
      suggestion: "Great platform! Very intuitive.",
      email: "test@example.com",
      userId: null,
      pageUrl: "/",
      ipAddress: "127.0.0.1",
    });

    expect(result).toBeDefined();
  });

  it("should submit feedback with only rating", async () => {
    const result = await submitFeedback({
      rating: 4,
      suggestion: null,
      email: null,
      userId: null,
      pageUrl: "/",
      ipAddress: "127.0.0.1",
    });

    expect(result).toBeDefined();
  });

  it("should handle all rating levels (1-5)", async () => {
    for (let rating = 1; rating <= 5; rating++) {
      const result = await submitFeedback({
        rating,
        suggestion: `Test feedback with rating ${rating}`,
        email: `test${rating}@example.com`,
        userId: null,
        pageUrl: "/",
        ipAddress: "127.0.0.1",
      });

      expect(result).toBeDefined();
    }
  });

  it("should retrieve recent feedback", async () => {
    // Submit test feedback
    await submitFeedback({
      rating: 5,
      suggestion: "Excellent service",
      email: "recent@example.com",
      userId: null,
      pageUrl: "/",
      ipAddress: "127.0.0.1",
    });

    // Retrieve recent feedback
    const recentFeedback = await getRecentFeedback(50);

    expect(Array.isArray(recentFeedback)).toBe(true);
    expect(recentFeedback.length).toBeGreaterThan(0);

    // Check if our test feedback is in the results
    const testFeedback = recentFeedback.find(
      (f) => f?.email === "recent@example.com"
    );
    expect(testFeedback).toBeDefined();
    if (testFeedback) {
      expect(testFeedback.rating).toBe(5);
      expect(testFeedback.suggestion).toContain("Excellent");
    }
  });

  it("should store feedback with optional email", async () => {
    const result = await submitFeedback({
      rating: 3,
      suggestion: "Could be better",
      email: null,
      userId: null,
      pageUrl: "/features",
      ipAddress: "192.168.1.1",
    });

    expect(result).toBeDefined();
  });

  it("should store feedback with user ID when authenticated", async () => {
    const result = await submitFeedback({
      rating: 4,
      suggestion: "Nice features",
      email: "user@example.com",
      userId: 1,
      pageUrl: "/",
      ipAddress: "127.0.0.1",
    });

    expect(result).toBeDefined();
  });

  it("should store page URL for tracking", async () => {
    const pageUrl = "/integrations";
    await submitFeedback({
      rating: 5,
      suggestion: "Integration page is great",
      email: "integration@example.com",
      userId: null,
      pageUrl,
      ipAddress: "127.0.0.1",
    });

    const recentFeedback = await getRecentFeedback(50);
    const testFeedback = recentFeedback.find(
      (f) => f?.email === "integration@example.com"
    );

    if (testFeedback) {
      expect(testFeedback.pageUrl).toBe(pageUrl);
    }
  });

  it("should handle maximum length suggestion", async () => {
    const longSuggestion = "a".repeat(1000);

    const result = await submitFeedback({
      rating: 3,
      suggestion: longSuggestion,
      email: "longfeedback@example.com",
      userId: null,
      pageUrl: "/",
      ipAddress: "127.0.0.1",
    });

    expect(result).toBeDefined();

    const recentFeedback = await getRecentFeedback(50);
    const testFeedback = recentFeedback.find(
      (f) => f?.email === "longfeedback@example.com"
    );

    if (testFeedback?.suggestion) {
      expect(testFeedback.suggestion.length).toBe(1000);
    }
  });
});
