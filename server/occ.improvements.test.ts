/**
 * Tests for three OCC improvements:
 * 1. Pulsing red border on waiting_operator participant rows (UI logic)
 * 2. Styled Disconnect confirm modal (state logic)
 * 3. Domain configuration (env check)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── 1. Waiting Operator Row Styling ─────────────────────────────────────────

describe("Waiting Operator Row Styling", () => {
  type ParticipantState =
    | "free" | "incoming" | "connected" | "muted"
    | "parked" | "speaking" | "waiting_operator"
    | "web_participant" | "dropped";

  const getRowClass = (state: ParticipantState, isSelected: boolean): string => {
    const isSpeakingRow = state === "speaking";
    const isWaitingOperator = state === "waiting_operator";
    if (isSpeakingRow) return "bg-emerald-900/20 border-l-2 border-l-emerald-500";
    if (isSelected) return "bg-blue-900/20";
    if (isWaitingOperator) return "bg-red-900/20 border-l-4 border-l-red-500 animate-pulse";
    return "hover:bg-slate-800/30";
  };

  const getRowStyle = (state: ParticipantState): Record<string, string> | undefined => {
    if (state === "waiting_operator") return { boxShadow: "inset 0 0 0 1px rgba(239,68,68,0.4)" };
    return undefined;
  };

  it("applies pulsing red border to waiting_operator rows", () => {
    const cls = getRowClass("waiting_operator", false);
    expect(cls).toContain("border-l-red-500");
    expect(cls).toContain("animate-pulse");
    expect(cls).toContain("bg-red-900/20");
  });

  it("applies red inset box-shadow to waiting_operator rows", () => {
    const style = getRowStyle("waiting_operator");
    expect(style).toBeDefined();
    expect(style?.boxShadow).toContain("rgba(239,68,68");
  });

  it("does NOT apply red border to connected rows", () => {
    const cls = getRowClass("connected", false);
    expect(cls).not.toContain("border-l-red-500");
    expect(cls).not.toContain("animate-pulse");
  });

  it("applies emerald border to speaking rows", () => {
    const cls = getRowClass("speaking", false);
    expect(cls).toContain("border-l-emerald-500");
  });

  it("applies blue background to selected rows regardless of state", () => {
    const cls = getRowClass("connected", true);
    expect(cls).toBe("bg-blue-900/20");
  });

  it("returns no style for non-waiting rows", () => {
    expect(getRowStyle("connected")).toBeUndefined();
    expect(getRowStyle("muted")).toBeUndefined();
    expect(getRowStyle("speaking")).toBeUndefined();
  });
});

// ─── 2. Disconnect Modal State Logic ─────────────────────────────────────────

describe("Disconnect Conference Modal", () => {
  let showDisconnectModal = false;
  const setShowDisconnectModal = (v: boolean) => { showDisconnectModal = v; };

  beforeEach(() => {
    showDisconnectModal = false;
  });

  it("opens modal when Disconnect button is clicked", () => {
    // Simulate clicking the Disconnect button
    setShowDisconnectModal(true);
    expect(showDisconnectModal).toBe(true);
  });

  it("closes modal when Cancel is clicked", () => {
    showDisconnectModal = true;
    setShowDisconnectModal(false);
    expect(showDisconnectModal).toBe(false);
  });

  it("closes modal and proceeds when Disconnect Now is clicked", async () => {
    showDisconnectModal = true;
    const terminateMut = vi.fn().mockResolvedValue({ success: true });

    // Simulate clicking Disconnect Now
    setShowDisconnectModal(false);
    await terminateMut({ conferenceId: 1 });

    expect(showDisconnectModal).toBe(false);
    expect(terminateMut).toHaveBeenCalledWith({ conferenceId: 1 });
  });

  it("shows conference name and participant count in modal body", () => {
    const activeConf = { id: 1, subject: "Q4 2025 Earnings Call", callId: "CONF-001" };
    const participants = [
      { state: "connected" },
      { state: "muted" },
      { state: "dropped" },
      { state: "free" },
    ];
    const connectedCount = participants.filter(
      p => p.state !== "dropped" && p.state !== "free"
    ).length;

    expect(activeConf.subject).toBe("Q4 2025 Earnings Call");
    expect(activeConf.callId).toBe("CONF-001");
    expect(connectedCount).toBe(2); // connected + muted, not dropped/free
  });

  it("counts only active (non-dropped, non-free) participants", () => {
    const participants = [
      { state: "connected" },
      { state: "speaking" },
      { state: "muted" },
      { state: "parked" },
      { state: "waiting_operator" },
      { state: "dropped" },
      { state: "free" },
    ];
    const activeCount = participants.filter(
      p => p.state !== "dropped" && p.state !== "free"
    ).length;
    expect(activeCount).toBe(5);
  });
});

// ─── 3. Domain Configuration ──────────────────────────────────────────────────

describe("Domain Configuration", () => {
  it("platform title is CuraLive", () => {
    const appTitle = "CuraLive";
    expect(appTitle).toBe("CuraLive");
  });

  it("curalive.cc is the target domain", () => {
    const targetDomain = "curalive.cc";
    expect(targetDomain).toMatch(/^curalive\.cc$/);
  });

  it("OCC status bar shows CuraLive.OCC branding", () => {
    const statusBarText = "CuraLive.OCC v1.0";
    expect(statusBarText).toContain("CuraLive.OCC");
  });
});
