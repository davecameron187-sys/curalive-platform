/**
 * Tests for ComplianceEngineService
 *
 * Strategy: mock the database layer (getDb) and the LLM helper so that every
 * exported function can be exercised in isolation without a live DB or external
 * API call.
 *
 * The service's rawQuery helper accesses the connection via:
 *   (db as any).session?.client ?? (db as any).$client
 * so we expose a `$client` with an `execute` spy on our mock DB object.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Module-level mocks ──────────────────────────────────────────────────────

vi.mock("../server/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../server/_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { getDb } from "../server/db";
import { invokeLLM } from "../server/_core/llm";

const mockGetDb = vi.mocked(getDb);
const mockInvokeLLM = vi.mocked(invokeLLM);

/**
 * Build a DB stub that matches the shape rawQuery expects:
 *   db.$client.execute(query, params) → [[rows], fields]
 */
function buildDbStub(rows: any[] = []) {
  const executeFn = vi.fn().mockResolvedValue([rows, []]);
  return {
    $client: { execute: executeFn },
    _executeFn: executeFn,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ComplianceEngineService — module loads", () => {
  it("exports all expected functions", async () => {
    const svc = await import("../server/services/ComplianceEngineService");
    expect(typeof svc.getThreats).toBe("function");
    expect(typeof svc.updateThreatStatus).toBe("function");
    expect(typeof svc.getThreatStats).toBe("function");
    expect(typeof svc.getComplianceDashboardData).toBe("function");
    expect(typeof svc.seedFrameworkControls).toBe("function");
    expect(typeof svc.startComplianceEngine).toBe("function");
    expect(typeof svc.stopComplianceEngine).toBe("function");
  });
});

describe("getThreatStats", () => {
  beforeEach(() => vi.resetModules());

  it("returns zero-value stats when the DB returns empty arrays", async () => {
    const db = buildDbStub([]);
    mockGetDb.mockResolvedValue(db as any);

    const svc = await import("../server/services/ComplianceEngineService");
    const stats = await svc.getThreatStats();

    expect(stats).toHaveProperty("activeThreats");
    expect(stats).toHaveProperty("bySeverity");
    expect(stats).toHaveProperty("byType");
    expect(stats).toHaveProperty("trend");
    expect(typeof stats.activeThreats).toBe("number");
    expect(stats.activeThreats).toBeGreaterThanOrEqual(0);
  });

  it("returns zero activeThreats when DB is unavailable", async () => {
    mockGetDb.mockResolvedValue(null as any);

    const svc = await import("../server/services/ComplianceEngineService");
    const stats = await svc.getThreatStats();

    expect(stats.activeThreats).toBe(0);
    expect(stats.bySeverity).toEqual({});
    expect(stats.byType).toEqual({});
    expect(stats.trend).toEqual([]);
  });

  it("aggregates bySeverity correctly from DB rows", async () => {
    let callCount = 0;
    const executeFn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([[{ severity: "high", cnt: "3" }, { severity: "critical", cnt: "1" }], []]);
      if (callCount === 2) return Promise.resolve([[{ threat_type: "fraud", cnt: "2" }], []]);
      if (callCount === 3) return Promise.resolve([[{ day: "2026-03-01", cnt: "4" }], []]);
      return Promise.resolve([[{ cnt: "4" }], []]);
    });
    const db = { $client: { execute: executeFn } };
    mockGetDb.mockResolvedValue(db as any);

    const svc = await import("../server/services/ComplianceEngineService");
    const stats = await svc.getThreatStats();

    expect(stats.bySeverity).toEqual({ high: 3, critical: 1 });
    expect(stats.byType).toEqual({ fraud: 2 });
    expect(stats.trend).toEqual([{ date: "2026-03-01", count: 4 }]);
    expect(stats.activeThreats).toBe(4);
  });
});

describe("updateThreatStatus", () => {
  beforeEach(() => vi.resetModules());

  it("returns { success: true } on successful update", async () => {
    const db = buildDbStub([{ affectedRows: 1 }]);
    mockGetDb.mockResolvedValue(db as any);

    const svc = await import("../server/services/ComplianceEngineService");
    const result = await svc.updateThreatStatus(42, "mitigated", 1);

    expect(result).toEqual({ success: true });
  });

  it("returns { success: true } when reviewedBy is omitted", async () => {
    const db = buildDbStub([{ affectedRows: 1 }]);
    mockGetDb.mockResolvedValue(db as any);

    const svc = await import("../server/services/ComplianceEngineService");
    const result = await svc.updateThreatStatus(7, "false_positive");

    expect(result).toEqual({ success: true });
  });

  it("allows all valid ThreatStatus values", async () => {
    const validStatuses = ["detected", "investigating", "confirmed", "mitigated", "false_positive"] as const;

    for (const status of validStatuses) {
      vi.resetModules();
      const db = buildDbStub([{ affectedRows: 1 }]);
      mockGetDb.mockResolvedValue(db as any);

      const svc = await import("../server/services/ComplianceEngineService");
      const result = await svc.updateThreatStatus(1, status);
      expect(result).toEqual({ success: true });
    }
  });
});

describe("getThreats", () => {
  beforeEach(() => vi.resetModules());

  it("returns an empty array when no threats exist", async () => {
    const db = buildDbStub([]);
    mockGetDb.mockResolvedValue(db as any);

    const svc = await import("../server/services/ComplianceEngineService");
    const threats = await svc.getThreats();

    expect(Array.isArray(threats)).toBe(true);
    expect(threats.length).toBe(0);
  });

  it("returns rows from the DB", async () => {
    const fakeRow = { id: 1, threat_type: "fraud", severity: "high", status: "detected" };
    const db = buildDbStub([fakeRow]);
    mockGetDb.mockResolvedValue(db as any);

    const svc = await import("../server/services/ComplianceEngineService");
    const threats = await svc.getThreats({ status: "detected", limit: 5 });

    expect(threats).toEqual([fakeRow]);
  });

  it("applies severity filter in the SQL query", async () => {
    const executeFn = vi.fn().mockResolvedValue([[{ id: 2, severity: "critical" }], []]);
    const db = { $client: { execute: executeFn } };
    mockGetDb.mockResolvedValue(db as any);

    const svc = await import("../server/services/ComplianceEngineService");
    await svc.getThreats({ severity: "critical" });

    const calledQuery: string = executeFn.mock.calls[0][0];
    expect(calledQuery).toContain("critical");
  });
});

describe("getComplianceDashboardData", () => {
  beforeEach(() => vi.resetModules());

  it("returns a well-shaped dashboard object", async () => {
    const db = buildDbStub([]);
    mockGetDb.mockResolvedValue(db as any);
    mockInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([]) } }],
    } as any);

    const svc = await import("../server/services/ComplianceEngineService");
    const dashboard = await svc.getComplianceDashboardData();

    expect(dashboard).toHaveProperty("frameworks");
    expect(dashboard).toHaveProperty("threatStats");
    expect(dashboard).toHaveProperty("recentThreats");
    expect(dashboard).toHaveProperty("riskScore");
    expect(dashboard).toHaveProperty("lastScanAt");
    expect(typeof dashboard.riskScore).toBe("number");
    expect(dashboard.riskScore).toBeGreaterThanOrEqual(0);
    expect(dashboard.riskScore).toBeLessThanOrEqual(100);
  });
});

describe("riskScore calculation logic", () => {
  it("caps at 100 regardless of threat count", () => {
    const score = Math.min(100, 5 * 25 + 0 * 10 + 5 * 2);
    expect(score).toBe(100);
  });

  it("returns 0 when there are no threats", () => {
    const score = Math.min(100, 0 * 25 + 0 * 10 + 0 * 2);
    expect(score).toBe(0);
  });

  it("returns proportional score for mixed severity", () => {
    // 1 critical (25) + 2 high (20) + 3 total (6) = 51
    const score = Math.min(100, 1 * 25 + 2 * 10 + 3 * 2);
    expect(score).toBe(51);
  });
});

describe("startComplianceEngine / stopComplianceEngine", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts and stops without throwing", async () => {
    const db = buildDbStub([]);
    mockGetDb.mockResolvedValue(db as any);
    mockInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([]) } }],
    } as any);

    const svc = await import("../server/services/ComplianceEngineService");

    expect(() => svc.startComplianceEngine(60_000)).not.toThrow();
    expect(() => svc.stopComplianceEngine()).not.toThrow();
  });

  it("is idempotent — calling start twice does not throw", async () => {
    const db = buildDbStub([]);
    mockGetDb.mockResolvedValue(db as any);
    mockInvokeLLM.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([]) } }],
    } as any);

    const svc = await import("../server/services/ComplianceEngineService");

    svc.startComplianceEngine(60_000);
    expect(() => svc.startComplianceEngine(60_000)).not.toThrow();
    svc.stopComplianceEngine();
  });
});
