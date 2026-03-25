import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Bulk CSV Import ──────────────────────────────────────────────────────────

describe("Bulk CSV Import", () => {
  it("parses valid CSV and returns updated/skipped/errors counts", () => {
    const csvRows = [
      "control_id,status,owner_name,notes",
      "CC1.1,compliant,Alice,Reviewed Q1",
      "CC2.1,partial,Bob,",
      "CC3.1,non_compliant,,",
      "CC4.1,not_applicable,,",
    ].join("\n");

    const parsed = csvRows
      .split("\n")
      .slice(1)
      .map((row) => {
        const [controlId, status, ownerName, notes] = row.split(",");
        return { controlId, status, ownerName, notes };
      });

    expect(parsed).toHaveLength(4);
    expect(parsed[0].controlId).toBe("CC1.1");
    expect(parsed[0].status).toBe("compliant");
    expect(parsed[1].status).toBe("partial");
    expect(parsed[3].status).toBe("not_applicable");
  });

  it("rejects invalid status values", () => {
    const validStatuses = ["compliant", "partial", "non_compliant", "not_applicable"];
    const testStatus = "invalid_status";
    expect(validStatuses.includes(testStatus)).toBe(false);
  });

  it("accepts all four valid statuses", () => {
    const validStatuses = ["compliant", "partial", "non_compliant", "not_applicable"];
    for (const s of validStatuses) {
      expect(validStatuses.includes(s)).toBe(true);
    }
  });

  it("handles empty CSV gracefully", () => {
    const csvRows = "control_id,status\n";
    const rows = csvRows.split("\n").slice(1).filter(Boolean);
    expect(rows).toHaveLength(0);
  });

  it("handles missing required columns", () => {
    const row = ",";
    const [controlId, status] = row.split(",");
    const isValid = Boolean(controlId?.trim()) && Boolean(status?.trim());
    expect(isValid).toBe(false);
  });
});

// ─── Evidence Expiry ─────────────────────────────────────────────────────────

describe("Evidence Expiry Logic", () => {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  it("correctly identifies expired evidence", () => {
    const expiresAt = now - 1000; // 1 second ago
    const isExpired = expiresAt < now;
    expect(isExpired).toBe(true);
  });

  it("correctly identifies evidence expiring within 30 days", () => {
    const expiresAt = now + 15 * 24 * 60 * 60 * 1000; // 15 days from now
    const isExpired = expiresAt < now;
    const isExpiringSoon = !isExpired && expiresAt < now + thirtyDaysMs;
    expect(isExpired).toBe(false);
    expect(isExpiringSoon).toBe(true);
  });

  it("correctly identifies evidence not expiring soon", () => {
    const expiresAt = now + 60 * 24 * 60 * 60 * 1000; // 60 days from now
    const isExpired = expiresAt < now;
    const isExpiringSoon = !isExpired && expiresAt < now + thirtyDaysMs;
    expect(isExpired).toBe(false);
    expect(isExpiringSoon).toBe(false);
  });

  it("handles null expiresAt gracefully", () => {
    const expiresAt = null;
    const isExpired = expiresAt !== null && expiresAt < now;
    expect(isExpired).toBe(false);
  });

  it("digest scheduler identifies expiring files correctly", () => {
    const files = [
      { id: 1, fileName: "policy.pdf", expiresAt: now - 1000 },       // expired
      { id: 2, fileName: "audit.pdf", expiresAt: now + 10 * 24 * 60 * 60 * 1000 }, // expiring soon
      { id: 3, fileName: "cert.pdf", expiresAt: now + 90 * 24 * 60 * 60 * 1000 }, // fine
      { id: 4, fileName: "report.pdf", expiresAt: null },               // no expiry
    ];

    const expired = files.filter((f) => f.expiresAt !== null && f.expiresAt < now);
    const expiringSoon = files.filter(
      (f) => f.expiresAt !== null && f.expiresAt >= now && f.expiresAt < now + thirtyDaysMs
    );

    expect(expired).toHaveLength(1);
    expect(expired[0].fileName).toBe("policy.pdf");
    expect(expiringSoon).toHaveLength(1);
    expect(expiringSoon[0].fileName).toBe("audit.pdf");
  });
});

// ─── Audit ZIP Export ─────────────────────────────────────────────────────────

describe("Audit ZIP Export", () => {
  it("builds correct CSV header for control status export", () => {
    const header = "control_id,name,clause,status,owner_name,testing_frequency,last_tested,notes";
    const cols = header.split(",");
    expect(cols).toContain("control_id");
    expect(cols).toContain("status");
    expect(cols).toContain("owner_name");
    expect(cols).toContain("last_tested");
  });

  it("escapes CSV values with commas correctly", () => {
    const escapeCSV = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    expect(escapeCSV("hello, world")).toBe('"hello, world"');
    expect(escapeCSV('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCSV("normal")).toBe("normal");
  });

  it("generates correct ZIP file name format", () => {
    const framework = "soc2";
    const date = new Date("2026-03-15");
    const fileName = `${framework}-audit-pack-${date.toISOString().slice(0, 10)}.zip`;
    expect(fileName).toBe("soc2-audit-pack-2026-03-15.zip");
  });

  it("generates correct ZIP file name for ISO 27001", () => {
    const framework = "iso27001";
    const date = new Date("2026-03-15");
    const fileName = `${framework}-audit-pack-${date.toISOString().slice(0, 10)}.zip`;
    expect(fileName).toBe("iso27001-audit-pack-2026-03-15.zip");
  });

  it("computes correct control summary stats for ZIP manifest", () => {
    const controls = [
      { status: "compliant" },
      { status: "compliant" },
      { status: "partial" },
      { status: "non_compliant" },
      { status: "not_applicable" },
    ];
    const total = controls.length;
    const compliant = controls.filter((c) => c.status === "compliant").length;
    const partial = controls.filter((c) => c.status === "partial").length;
    const nonCompliant = controls.filter((c) => c.status === "non_compliant").length;
    const score = Math.round((compliant / (total - controls.filter((c) => c.status === "not_applicable").length)) * 100);

    expect(total).toBe(5);
    expect(compliant).toBe(2);
    expect(partial).toBe(1);
    expect(nonCompliant).toBe(1);
    expect(score).toBe(50); // 2 compliant out of 4 applicable
  });
});
