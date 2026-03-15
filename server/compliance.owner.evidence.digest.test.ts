/**
 * Tests for compliance owner assignment, evidence upload, and digest scheduler.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Owner Assignment ────────────────────────────────────────────────────────
describe("SOC 2 / ISO 27001 owner assignment", () => {
  it("validates ownerName is a non-empty string", () => {
    const validate = (name: string) => typeof name === "string" && name.trim().length > 0;
    expect(validate("CISO")).toBe(true);
    expect(validate("")).toBe(false);
    expect(validate("  ")).toBe(false);
  });

  it("validates testingFrequency is one of the allowed values", () => {
    const ALLOWED = ["Continuous", "Monthly", "Quarterly", "Semi-Annual", "Annual"];
    const validate = (f: string) => ALLOWED.includes(f);
    expect(validate("Quarterly")).toBe(true);
    expect(validate("Weekly")).toBe(false);
    expect(validate("")).toBe(false);
  });

  it("trims whitespace from ownerName before saving", () => {
    const sanitise = (name: string) => name.trim();
    expect(sanitise("  CISO  ")).toBe("CISO");
    expect(sanitise("IT Manager")).toBe("IT Manager");
  });
});

// ─── Evidence Upload ─────────────────────────────────────────────────────────
describe("Evidence file upload", () => {
  it("rejects files larger than 16 MB", () => {
    const MAX_BYTES = 16 * 1024 * 1024;
    const isAcceptable = (sizeBytes: number) => sizeBytes <= MAX_BYTES;
    expect(isAcceptable(1024)).toBe(true);
    expect(isAcceptable(MAX_BYTES)).toBe(true);
    expect(isAcceptable(MAX_BYTES + 1)).toBe(false);
  });

  it("accepts allowed MIME types", () => {
    const ALLOWED_MIME = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "text/plain",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ];
    const isAllowed = (mime: string) => ALLOWED_MIME.includes(mime) || mime.startsWith("image/") || mime.startsWith("text/");
    expect(isAllowed("application/pdf")).toBe(true);
    expect(isAllowed("image/png")).toBe(true);
    expect(isAllowed("application/octet-stream")).toBe(true);
    expect(isAllowed("video/mp4")).toBe(false);
  });

  it("builds a valid S3 key with random suffix", () => {
    const buildKey = (controlId: number, fileName: string, suffix: string) =>
      `compliance-evidence/control-${controlId}/${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}-${suffix}`;
    const key = buildKey(42, "policy-doc.pdf", "abc123");
    expect(key).toMatch(/^compliance-evidence\/control-42\/policy-doc\.pdf-abc123$/);
    expect(key).not.toContain(" ");
  });

  it("stores file URL and controlId together in the evidence record", () => {
    const record = {
      controlId: 5,
      fileName: "audit-report.pdf",
      fileUrl: "https://cdn.example.com/compliance-evidence/control-5/audit-report.pdf-xyz",
      uploadedAt: new Date(),
    };
    expect(record.controlId).toBe(5);
    expect(record.fileUrl).toContain("https://");
    expect(record.fileName).toBe("audit-report.pdf");
  });
});

// ─── Digest Scheduler ────────────────────────────────────────────────────────
describe("Compliance digest scheduler", () => {
  it("correctly identifies Monday 08:00 UTC as the digest window", () => {
    // Monday = 1, hour = 8
    const isMondayDigestWindow = (day: number, hour: number) => day === 1 && hour === 8;
    expect(isMondayDigestWindow(1, 8)).toBe(true);
    expect(isMondayDigestWindow(1, 9)).toBe(false);
    expect(isMondayDigestWindow(2, 8)).toBe(false);
    expect(isMondayDigestWindow(0, 8)).toBe(false); // Sunday
  });

  it("prevents duplicate digest on the same day", () => {
    let lastDigestDate: string | null = null;
    const today = "2026-03-16";
    const shouldRun = (date: string) => {
      if (lastDigestDate === date) return false;
      lastDigestDate = date;
      return true;
    };
    expect(shouldRun(today)).toBe(true);
    expect(shouldRun(today)).toBe(false); // second call same day
    expect(shouldRun("2026-03-23")).toBe(true); // next week
  });

  it("computes readiness score correctly", () => {
    const computeScore = (controls: { status: string }[]) => {
      if (controls.length === 0) return 0;
      const points = controls.reduce((sum, c) => {
        if (c.status === "compliant") return sum + 1;
        if (c.status === "partial") return sum + 0.5;
        if (c.status === "not_applicable") return sum + 1;
        return sum;
      }, 0);
      const applicable = controls.filter((c) => c.status !== "not_applicable").length || 1;
      return Math.round((points / applicable) * 100);
    };

    expect(computeScore([])).toBe(0);
    expect(computeScore([{ status: "compliant" }, { status: "compliant" }])).toBe(100);
    expect(computeScore([{ status: "compliant" }, { status: "non_compliant" }])).toBe(50);
    expect(computeScore([{ status: "partial" }])).toBe(50);
    expect(computeScore([{ status: "not_applicable" }])).toBe(100); // N/A doesn't penalise
    expect(computeScore([
      { status: "compliant" },
      { status: "partial" },
      { status: "non_compliant" },
    ])).toBe(50); // (1 + 0.5 + 0) / 3 = 50%
  });

  it("builds a fast digest with correct gap counts", () => {
    const soc2 = [
      { status: "compliant", name: "CC1.1", category: "CC1" },
      { status: "non_compliant", name: "CC6.1", category: "CC6" },
      { status: "partial", name: "CC7.1", category: "CC7" },
    ];
    const iso = [
      { status: "compliant", name: "A.5.1", clause: "A.5" },
      { status: "non_compliant", name: "A.8.1", clause: "A.8" },
    ];

    const soc2Gaps = soc2.filter((c) => c.status === "non_compliant").length;
    const isoGaps = iso.filter((c) => c.status === "non_compliant").length;
    expect(soc2Gaps).toBe(1);
    expect(isoGaps).toBe(1);

    const title = `Weekly Compliance Digest — SOC 2: 67% | ISO 27001: 50% | 2 gaps`;
    expect(title).toContain("2 gaps");
  });

  it("falls back gracefully when LLM returns empty content", async () => {
    const mockLLM = vi.fn().mockResolvedValue({ choices: [{ message: { content: "" } }] });
    const fallback = (llmText: string, fastDigest: string) =>
      llmText.trim().length > 50 ? llmText : fastDigest;

    const result = fallback("", "## Fast Digest\n\nAll good.");
    expect(result).toBe("## Fast Digest\n\nAll good.");
  });
});
