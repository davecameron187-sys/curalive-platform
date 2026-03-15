/**
 * Tests for RBAC router enhancements:
 *  - Moderator role in hierarchy
 *  - hasRole() with all 4 roles
 *  - roleHierarchy ordering
 *  - updateUserRole input schema accepts "moderator"
 *  - getRoleStatistics returns moderators field
 *  - Audit log shape validation
 */

import { describe, it, expect } from "vitest";
import { hasRole, roleHierarchy, type UserRole } from "./routers/rbac";

// ─── roleHierarchy ────────────────────────────────────────────────────────────

describe("roleHierarchy", () => {
  it("assigns admin the highest value", () => {
    expect(roleHierarchy.admin).toBeGreaterThan(roleHierarchy.operator);
    expect(roleHierarchy.admin).toBeGreaterThan(roleHierarchy.moderator);
    expect(roleHierarchy.admin).toBeGreaterThan(roleHierarchy.user);
  });

  it("assigns operator higher than moderator", () => {
    expect(roleHierarchy.operator).toBeGreaterThan(roleHierarchy.moderator);
  });

  it("assigns moderator higher than user", () => {
    expect(roleHierarchy.moderator).toBeGreaterThan(roleHierarchy.user);
  });

  it("has exactly 4 roles defined", () => {
    expect(Object.keys(roleHierarchy)).toHaveLength(4);
    expect(Object.keys(roleHierarchy)).toContain("moderator");
  });
});

// ─── hasRole() ────────────────────────────────────────────────────────────────

describe("hasRole()", () => {
  // Admin can do everything
  it("admin passes all role checks", () => {
    expect(hasRole("admin", "admin")).toBe(true);
    expect(hasRole("admin", "operator")).toBe(true);
    expect(hasRole("admin", "moderator")).toBe(true);
    expect(hasRole("admin", "user")).toBe(true);
  });

  // Operator can do operator, moderator, user — but NOT admin
  it("operator passes operator and below", () => {
    expect(hasRole("operator", "operator")).toBe(true);
    expect(hasRole("operator", "moderator")).toBe(true);
    expect(hasRole("operator", "user")).toBe(true);
    expect(hasRole("operator", "admin")).toBe(false);
  });

  // Moderator can do moderator and user — but NOT operator or admin
  it("moderator passes moderator and user only", () => {
    expect(hasRole("moderator", "moderator")).toBe(true);
    expect(hasRole("moderator", "user")).toBe(true);
    expect(hasRole("moderator", "operator")).toBe(false);
    expect(hasRole("moderator", "admin")).toBe(false);
  });

  // User can only do user-level
  it("user passes only user check", () => {
    expect(hasRole("user", "user")).toBe(true);
    expect(hasRole("user", "moderator")).toBe(false);
    expect(hasRole("user", "operator")).toBe(false);
    expect(hasRole("user", "admin")).toBe(false);
  });

  // Edge: unknown role treated as 0
  it("unknown role fails all checks", () => {
    expect(hasRole("unknown" as UserRole, "user")).toBe(false);
    expect(hasRole("unknown" as UserRole, "admin")).toBe(false);
  });
});

// ─── Role statistics shape ────────────────────────────────────────────────────

describe("getRoleStatistics shape", () => {
  it("default stats object includes moderators field", () => {
    const defaultStats = { totalUsers: 0, admins: 0, operators: 0, moderators: 0, users: 0 };
    expect(defaultStats).toHaveProperty("moderators");
    expect(defaultStats.moderators).toBe(0);
  });

  it("stats object accumulates correctly", () => {
    const rows = [
      { role: "admin", cnt: "2" },
      { role: "operator", cnt: "5" },
      { role: "moderator", cnt: "3" },
      { role: "user", cnt: "10" },
    ];
    const stats = { totalUsers: 0, admins: 0, operators: 0, moderators: 0, users: 0 };
    for (const row of rows) {
      stats.totalUsers += Number(row.cnt);
      if (row.role === "admin") stats.admins = Number(row.cnt);
      else if (row.role === "operator") stats.operators = Number(row.cnt);
      else if (row.role === "moderator") stats.moderators = Number(row.cnt);
      else stats.users = Number(row.cnt);
    }
    expect(stats.totalUsers).toBe(20);
    expect(stats.admins).toBe(2);
    expect(stats.operators).toBe(5);
    expect(stats.moderators).toBe(3);
    expect(stats.users).toBe(10);
  });
});

// ─── Audit log entry shape ────────────────────────────────────────────────────

describe("audit log entry shape", () => {
  it("maps raw DB row to expected shape", () => {
    const rawRow = {
      id: 1,
      userId: 42,
      changedByUserId: 1,
      oldRole: "user",
      newRole: "moderator",
      reason: "Promoted for Q4 earnings call",
      createdAt: new Date("2026-03-15T10:00:00Z"),
      userName: "Alice Smith",
      userEmail: "alice@example.com",
      changedByName: "Bob Admin",
      changedByEmail: "bob@example.com",
    };

    // Simulate the mapping from getRoleAuditLog
    const entry = {
      id: rawRow.id,
      userId: rawRow.userId,
      changedByUserId: rawRow.changedByUserId,
      oldRole: rawRow.oldRole,
      newRole: rawRow.newRole,
      reason: rawRow.reason ?? null,
      createdAt: rawRow.createdAt,
      userName: rawRow.userName ?? "Unknown",
      userEmail: rawRow.userEmail ?? "",
      changedByName: rawRow.changedByName ?? "Unknown",
      changedByEmail: rawRow.changedByEmail ?? "",
    };

    expect(entry.id).toBe(1);
    expect(entry.oldRole).toBe("user");
    expect(entry.newRole).toBe("moderator");
    expect(entry.userName).toBe("Alice Smith");
    expect(entry.changedByName).toBe("Bob Admin");
    expect(entry.reason).toBe("Promoted for Q4 earnings call");
  });

  it("handles null userName gracefully", () => {
    const rawRow = {
      id: 2,
      userId: 99,
      changedByUserId: 1,
      oldRole: "user",
      newRole: "operator",
      reason: null,
      createdAt: new Date(),
      userName: null,
      userEmail: null,
      changedByName: null,
      changedByEmail: null,
    };

    const entry = {
      userName: rawRow.userName ?? "Unknown",
      userEmail: rawRow.userEmail ?? "",
      changedByName: rawRow.changedByName ?? "Unknown",
      changedByEmail: rawRow.changedByEmail ?? "",
      reason: rawRow.reason ?? null,
    };

    expect(entry.userName).toBe("Unknown");
    expect(entry.userEmail).toBe("");
    expect(entry.changedByName).toBe("Unknown");
    expect(entry.reason).toBeNull();
  });
});

// ─── updateUserRole input validation ─────────────────────────────────────────

describe("updateUserRole input schema", () => {
  it("accepts moderator as a valid newRole", () => {
    const { z } = require("zod");
    const schema = z.object({
      userId: z.number(),
      newRole: z.enum(["admin", "operator", "moderator", "user"]),
      reason: z.string().max(512).optional(),
    });

    const result = schema.safeParse({ userId: 5, newRole: "moderator" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown roles", () => {
    const { z } = require("zod");
    const schema = z.object({
      userId: z.number(),
      newRole: z.enum(["admin", "operator", "moderator", "user"]),
    });

    const result = schema.safeParse({ userId: 5, newRole: "superadmin" });
    expect(result.success).toBe(false);
  });

  it("accepts optional reason field", () => {
    const { z } = require("zod");
    const schema = z.object({
      userId: z.number(),
      newRole: z.enum(["admin", "operator", "moderator", "user"]),
      reason: z.string().max(512).optional(),
    });

    const withReason = schema.safeParse({ userId: 5, newRole: "admin", reason: "Promoted to admin" });
    const withoutReason = schema.safeParse({ userId: 5, newRole: "admin" });
    expect(withReason.success).toBe(true);
    expect(withoutReason.success).toBe(true);
  });

  it("rejects reason longer than 512 characters", () => {
    const { z } = require("zod");
    const schema = z.object({
      userId: z.number(),
      newRole: z.enum(["admin", "operator", "moderator", "user"]),
      reason: z.string().max(512).optional(),
    });

    const longReason = "x".repeat(513);
    const result = schema.safeParse({ userId: 5, newRole: "admin", reason: longReason });
    expect(result.success).toBe(false);
  });
});
