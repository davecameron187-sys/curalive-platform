import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { webcastRegistrations, webcastEvents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Webcast Registration", () => {
  let db: any;
  let testEventId: number;
  const testSlug = `test-event-${Date.now()}-${Math.random()}`;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      // Create a test event
      await db.insert(webcastEvents).values({
        slug: testSlug,
        title: "Test Webcast Event",
        eventType: "webcast",
        industryVertical: "general",
        status: "scheduled",
        registrationEnabled: true,
        chatEnabled: true,
        qaEnabled: true,
        pollsEnabled: true,
        recordingEnabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Get the inserted event ID
      const events = await db
        .select()
        .from(webcastEvents)
        .where(eq(webcastEvents.slug, testSlug))
        .limit(1);

      if (events.length > 0) {
        testEventId = events[0].id;
      } else {
        throw new Error("Failed to create test event");
      }
    } catch (error) {
      console.error("Test setup error:", error);
      throw error;
    }
  });

  afterAll(async () => {
    if (!db || !testEventId) return;

    try {
      // Clean up test data
      await db
        .delete(webcastRegistrations)
        .where(eq(webcastRegistrations.eventId, testEventId));

      await db
        .delete(webcastEvents)
        .where(eq(webcastEvents.id, testEventId));
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  it("should register an attendee for a webcast", async () => {
    if (!db || !testEventId) {
      throw new Error("Test setup failed");
    }

    const email = `john.doe.${Date.now()}@example.com`;

    await db.insert(webcastRegistrations).values({
      eventId: testEventId,
      firstName: "John",
      lastName: "Doe",
      email,
      company: "Test Company",
      jobTitle: "Director",
      phone: "+1234567890",
      country: "USA",
      registrationSource: "direct",
      registeredAt: Date.now(),
    });

    const registrations = await db
      .select()
      .from(webcastRegistrations)
      .where(eq(webcastRegistrations.email, email));

    expect(registrations.length).toBe(1);
    expect(registrations[0].firstName).toBe("John");
    expect(registrations[0].lastName).toBe("Doe");
  });

  it("should get all registrations for an event", async () => {
    if (!db || !testEventId) {
      throw new Error("Test setup failed");
    }

    const baseEmail = `attendee-${Date.now()}`;

    // Register multiple attendees
    for (let i = 0; i < 3; i++) {
      await db.insert(webcastRegistrations).values({
        eventId: testEventId,
        firstName: `Attendee${i}`,
        lastName: `User${i}`,
        email: `${baseEmail}-${i}@example.com`,
        registrationSource: "direct",
        registeredAt: Date.now(),
      });
    }

    const registrations = await db
      .select()
      .from(webcastRegistrations)
      .where(eq(webcastRegistrations.eventId, testEventId));

    expect(registrations.length).toBeGreaterThanOrEqual(3);
  });

  it("should update registration status to attended", async () => {
    if (!db || !testEventId) {
      throw new Error("Test setup failed");
    }

    const email = `test.attended.${Date.now()}@example.com`;

    // Register attendee
    await db.insert(webcastRegistrations).values({
      eventId: testEventId,
      firstName: "Test",
      lastName: "Attendee",
      email,
      registrationSource: "direct",
      registeredAt: Date.now(),
    });

    // Get the registration
    const [registration] = await db
      .select()
      .from(webcastRegistrations)
      .where(eq(webcastRegistrations.email, email))
      .limit(1);

    expect(registration).toBeDefined();

    // Update to attended
    const now = Date.now();
    await db
      .update(webcastRegistrations)
      .set({
        attended: true,
        joinedAt: now,
      })
      .where(eq(webcastRegistrations.id, registration.id));

    // Verify update
    const [updated] = await db
      .select()
      .from(webcastRegistrations)
      .where(eq(webcastRegistrations.id, registration.id))
      .limit(1);

    expect(updated.attended).toBe(true);
  });

  it("should track watch time and engagement score", async () => {
    if (!db || !testEventId) {
      throw new Error("Test setup failed");
    }

    const email = `test.engagement.${Date.now()}@example.com`;

    // Register attendee
    await db.insert(webcastRegistrations).values({
      eventId: testEventId,
      firstName: "Engaged",
      lastName: "User",
      email,
      registrationSource: "direct",
      registeredAt: Date.now(),
    });

    // Get the registration
    const [registration] = await db
      .select()
      .from(webcastRegistrations)
      .where(eq(webcastRegistrations.email, email))
      .limit(1);

    // Update engagement metrics
    const watchTimeSeconds = 3600;
    const engagementScore = 85;

    await db
      .update(webcastRegistrations)
      .set({
        watchTimeSeconds,
        engagementScore,
        attended: true,
        joinedAt: Date.now(),
      })
      .where(eq(webcastRegistrations.id, registration.id));

    // Verify metrics
    const [updated] = await db
      .select()
      .from(webcastRegistrations)
      .where(eq(webcastRegistrations.id, registration.id))
      .limit(1);

    expect(updated.watchTimeSeconds).toBe(watchTimeSeconds);
    expect(updated.engagementScore).toBe(engagementScore);
  });

  it("should get live attendee count", async () => {
    if (!db || !testEventId) {
      throw new Error("Test setup failed");
    }

    const baseEmail = `live-${Date.now()}`;

    // Register and mark some as joined
    for (let i = 0; i < 3; i++) {
      await db.insert(webcastRegistrations).values({
        eventId: testEventId,
        firstName: `Live${i}`,
        lastName: `User${i}`,
        email: `${baseEmail}-${i}@example.com`,
        registrationSource: "direct",
        registeredAt: Date.now(),
        joinedAt: Date.now(),
      });
    }

    // Get live count
    const liveRegistrations = await db
      .select()
      .from(webcastRegistrations)
      .where(eq(webcastRegistrations.eventId, testEventId));

    const liveCount = liveRegistrations.filter((r) => r.joinedAt).length;

    expect(liveCount).toBeGreaterThanOrEqual(3);
  });

  it("should handle optional fields", async () => {
    if (!db || !testEventId) {
      throw new Error("Test setup failed");
    }

    const email = `minimal.${Date.now()}@example.com`;

    // Register with minimal required fields
    await db.insert(webcastRegistrations).values({
      eventId: testEventId,
      firstName: "Minimal",
      lastName: "User",
      email,
      registrationSource: "direct",
      registeredAt: Date.now(),
    });

    // Verify registration
    const [registration] = await db
      .select()
      .from(webcastRegistrations)
      .where(eq(webcastRegistrations.email, email))
      .limit(1);

    expect(registration).toBeDefined();
    expect(registration.firstName).toBe("Minimal");
    expect(registration.lastName).toBe("User");
    expect(registration.company).toBeNull();
  });

  it("should calculate registration statistics", async () => {
    if (!db || !testEventId) {
      throw new Error("Test setup failed");
    }

    const registrations = await db
      .select()
      .from(webcastRegistrations)
      .where(eq(webcastRegistrations.eventId, testEventId));

    const stats = {
      total: registrations.length,
      attended: registrations.filter((r) => r.attended).length,
      joined: registrations.filter((r) => r.joinedAt).length,
    };

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.attended).toBeLessThanOrEqual(stats.total);
    expect(stats.joined).toBeLessThanOrEqual(stats.total);
  });
});
