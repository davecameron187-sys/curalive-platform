/**
 * Tests for the repeating audible alert logic in CuraLive.OCC
 *
 * The alert system works as follows:
 * - When waiting_operator count goes from 0 → N: start interval (play every 3s)
 * - When waiting_operator count drops to 0: stop interval
 * - When count increases while already ringing: play extra beep immediately
 * - stopRinging() clears the interval and sets isRinging=false
 * - Volume is scaled by settingAlertVolume (0–100)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Helpers that mirror the OCC.tsx logic ────────────────────────────────────

interface AlertState {
  isRinging: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
  beepCount: number;
}

function createAlertController(onBeep: () => void) {
  const state: AlertState = {
    isRinging: false,
    intervalId: null,
    beepCount: 0,
  };

  const playBeep = () => {
    state.beepCount++;
    onBeep();
  };

  const stopRinging = () => {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.isRinging = false;
  };

  let prevCount = 0;

  const onParticipantCountChange = (count: number) => {
    const prev = prevCount;
    prevCount = count;

    if (count > 0 && !state.intervalId) {
      // New caller — start ringing immediately
      playBeep();
      state.isRinging = true;
      state.intervalId = setInterval(playBeep, 3000);
    } else if (count === 0 && state.intervalId) {
      // All callers gone — stop
      stopRinging();
    } else if (count > prev && state.intervalId) {
      // Additional caller while already ringing
      playBeep();
    }
  };

  return { state, stopRinging, onParticipantCountChange };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("OCC Repeating Audible Alert", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays a beep immediately when the first caller enters waiting_operator state", () => {
    const beepFn = vi.fn();
    const { onParticipantCountChange } = createAlertController(beepFn);

    onParticipantCountChange(1);

    expect(beepFn).toHaveBeenCalledTimes(1);
  });

  it("starts repeating every 3 seconds while callers are waiting", () => {
    const beepFn = vi.fn();
    const { onParticipantCountChange } = createAlertController(beepFn);

    onParticipantCountChange(1);
    expect(beepFn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);
    expect(beepFn).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(3000);
    expect(beepFn).toHaveBeenCalledTimes(3);
  });

  it("stops ringing when all callers are answered (count drops to 0)", () => {
    const beepFn = vi.fn();
    const { state, onParticipantCountChange } = createAlertController(beepFn);

    onParticipantCountChange(1);
    expect(state.isRinging).toBe(true);

    onParticipantCountChange(0);
    expect(state.isRinging).toBe(false);
    expect(state.intervalId).toBeNull();

    // No more beeps after stopping
    const countBefore = beepFn.mock.calls.length;
    vi.advanceTimersByTime(9000);
    expect(beepFn).toHaveBeenCalledTimes(countBefore);
  });

  it("plays an extra beep when a second caller arrives while already ringing", () => {
    const beepFn = vi.fn();
    const { onParticipantCountChange } = createAlertController(beepFn);

    onParticipantCountChange(1); // first caller — starts ring
    const afterFirst = beepFn.mock.calls.length;

    onParticipantCountChange(2); // second caller — extra beep
    expect(beepFn).toHaveBeenCalledTimes(afterFirst + 1);
  });

  it("does not start a second interval if already ringing", () => {
    const beepFn = vi.fn();
    const { state, onParticipantCountChange } = createAlertController(beepFn);

    onParticipantCountChange(1);
    const firstIntervalId = state.intervalId;

    // Simulate the effect running again with the same count (no change)
    onParticipantCountChange(1);
    expect(state.intervalId).toBe(firstIntervalId); // same interval, not replaced
  });

  it("stopRinging() clears the interval and sets isRinging to false", () => {
    const beepFn = vi.fn();
    const { state, stopRinging, onParticipantCountChange } = createAlertController(beepFn);

    onParticipantCountChange(2);
    expect(state.isRinging).toBe(true);

    stopRinging();
    expect(state.isRinging).toBe(false);
    expect(state.intervalId).toBeNull();
  });

  it("does not play any beep when count stays at 0", () => {
    const beepFn = vi.fn();
    const { onParticipantCountChange } = createAlertController(beepFn);

    onParticipantCountChange(0);
    vi.advanceTimersByTime(9000);
    expect(beepFn).not.toHaveBeenCalled();
  });

  it("volume fraction is clamped between 0.05 and 1.0", () => {
    // Mirrors the gain calculation: Math.max(0.05, Math.min(1, volume / 100))
    const clampVolume = (v: number) => Math.max(0.05, Math.min(1, v / 100));

    expect(clampVolume(0)).toBe(0.05);
    expect(clampVolume(70)).toBeCloseTo(0.7);
    expect(clampVolume(100)).toBe(1.0);
    expect(clampVolume(150)).toBe(1.0);
    expect(clampVolume(-10)).toBe(0.05);
  });
});
