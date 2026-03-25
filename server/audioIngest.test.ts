/**
 * audioIngest.test.ts — Tests for the live audio ingest worker
 *
 * Tests the in-process worker registry and the mux router's
 * startAudioIngest / stopAudioIngest / getAudioIngestStatus procedures.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  startIngest,
  stopIngest,
  getIngestStatus,
  listActiveIngests,
  stopAllIngests,
} from "./audioIngest";

// ─── Mock child_process.spawn ─────────────────────────────────────────────────

vi.mock("child_process", () => {
  const EventEmitter = require("events");

  class MockChildProcess extends EventEmitter {
    stdin = null;
    stdout = null;
    stderr = new EventEmitter();
    killed = false;

    kill(signal?: string) {
      this.killed = true;
      // Emit exit after a short delay to simulate graceful shutdown
      setTimeout(() => this.emit("exit", null, signal ?? "SIGTERM"), 10);
    }
  }

  return {
    spawn: vi.fn(() => new MockChildProcess()),
  };
});

// ─── Mock fs.mkdir and fs.rm ──────────────────────────────────────────────────

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: vi.fn().mockResolvedValue(undefined),
      readdir: vi.fn().mockResolvedValue([]),
      rm: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(Buffer.alloc(0)),
      unlink: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("audioIngest worker", () => {
  beforeEach(async () => {
    // Clean up any workers from previous tests
    await stopAllIngests();
  });

  afterEach(async () => {
    await stopAllIngests();
  });

  it("starts a worker and registers it in the worker map", async () => {
    const worker = await startIngest(
      "test-stream-001",
      "https://stream.mux.com/test.m3u8",
      "curalive-event-1"
    );

    expect(worker.streamId).toBe("test-stream-001");
    expect(worker.status).toBe("running");
    expect(worker.hlsUrl).toBe("https://stream.mux.com/test.m3u8");
    expect(worker.ablyChannel).toBe("curalive-event-1");
    expect(worker.segmentsProcessed).toBe(0);
    expect(worker.ffmpegProcess).not.toBeNull();
  });

  it("getIngestStatus returns the worker when running", async () => {
    await startIngest("test-stream-002", "https://stream.mux.com/test2.m3u8", "curalive-event-2");

    const status = getIngestStatus("test-stream-002");
    expect(status).not.toBeNull();
    expect(status?.status).toBe("running");
    expect(status?.streamId).toBe("test-stream-002");
  });

  it("getIngestStatus returns null for unknown stream", () => {
    const status = getIngestStatus("nonexistent-stream");
    expect(status).toBeNull();
  });

  it("listActiveIngests returns all running workers", async () => {
    await startIngest("test-stream-003", "https://stream.mux.com/test3.m3u8", "curalive-event-3");
    await startIngest("test-stream-004", "https://stream.mux.com/test4.m3u8", "curalive-event-4");

    const active = listActiveIngests();
    const ids = active.map((w) => w.streamId);
    expect(ids).toContain("test-stream-003");
    expect(ids).toContain("test-stream-004");
  });

  it("stopIngest removes the worker from the registry", async () => {
    await startIngest("test-stream-005", "https://stream.mux.com/test5.m3u8", "curalive-event-5");
    expect(getIngestStatus("test-stream-005")).not.toBeNull();

    await stopIngest("test-stream-005");
    expect(getIngestStatus("test-stream-005")).toBeNull();
  });

  it("stopIngest is idempotent for unknown streams", async () => {
    // Should not throw
    await expect(stopIngest("nonexistent-stream")).resolves.toBeUndefined();
  });

  it("starting a second worker for the same stream stops the first", async () => {
    const worker1 = await startIngest(
      "test-stream-006",
      "https://stream.mux.com/test6.m3u8",
      "curalive-event-6"
    );
    const ffmpeg1 = worker1.ffmpegProcess;

    // Start a second worker for the same stream — should replace the first
    const worker2 = await startIngest(
      "test-stream-006",
      "https://stream.mux.com/test6-v2.m3u8",
      "curalive-event-6-v2"
    );

    expect(worker2.hlsUrl).toBe("https://stream.mux.com/test6-v2.m3u8");
    expect(worker2.status).toBe("running");
    // The first ffmpeg process should have been killed
    expect((ffmpeg1 as any).killed).toBe(true);
  });

  it("stopAllIngests stops every active worker", async () => {
    await startIngest("test-stream-007", "https://stream.mux.com/test7.m3u8", "curalive-event-7");
    await startIngest("test-stream-008", "https://stream.mux.com/test8.m3u8", "curalive-event-8");

    await stopAllIngests();

    expect(listActiveIngests()).toHaveLength(0);
    expect(getIngestStatus("test-stream-007")).toBeNull();
    expect(getIngestStatus("test-stream-008")).toBeNull();
  });
});

// ─── tRPC procedure tests ─────────────────────────────────────────────────────

describe("mux.getAudioIngestStatus procedure", () => {
  it("returns stopped status for unknown stream", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "test", name: "Test", email: "test@test.com", role: "user", createdAt: new Date() },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.mux.getAudioIngestStatus({ muxStreamId: "unknown-stream" });
    expect(result.status).toBe("stopped");
    expect(result.segmentsProcessed).toBe(0);
  });
});
