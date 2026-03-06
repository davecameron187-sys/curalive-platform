/*
 * CuraLive — Ably Real-Time Context
 *
 * Architecture: Dual-mode real-time layer.
 *
 * DEMO MODE (no ABLY_API_KEY configured):
 *   Uses a shared in-memory event bus. All views (EventRoom, Moderator, Presenter)
 *   share the same React context, so messages published from one view are instantly
 *   received by all others in the same browser session.
 *
 * PRODUCTION MODE (ABLY_API_KEY set in server secrets):
 *   The AblyProvider fetches a short-lived token request from /api/trpc/ably.tokenRequest,
 *   then opens a real Ably.Realtime connection. All messages are published and received
 *   over Ably's global edge network — enabling cross-device, cross-browser sync.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";;

// ─── Types ────────────────────────────────────────────────────────────────────

export type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  timeLabel: string;
};

export type QAItem = {
  id: string;
  question: string;
  author: string;
  votes: number;
  status: "pending" | "approved" | "answered" | "rejected";
  submittedAt: number;
};

export type Poll = {
  id: string;
  question: string;
  options: { id: string; label: string; votes: number }[];
  status: "draft" | "live" | "closed";
  createdAt: number;
};

export type SentimentUpdate = {
  score: number;
  label: "Positive" | "Neutral" | "Cautious" | "Negative";
  keywords?: string[];
  timestamp: number;
};

export type RollingSummary = {
  text: string;
  timestamp: number;
  segmentCount: number;
};

export type PresenceUser = {
  id: string;
  name: string;
  role: "attendee" | "moderator" | "presenter";
  joinedAt: number;
};

export type RaisedHand = {
  id: string;
  name: string;
  raisedAt: number;
  status: "waiting" | "unmuted" | "dismissed";
};

export type ChatTranslationEvent = {
  messageId: number;
  detectedLanguage: string;
  translatedMessage: string;
  translationLanguage: string;
};

export type CuraLiveMessage =
  | { type: "transcript.segment"; data: TranscriptSegment }
  | { type: "sentiment.update"; data: SentimentUpdate }
  | { type: "qa.submitted"; data: QAItem }
  | { type: "qa.vote"; data: { id: string; votes: number } }
  | { type: "qa.status"; data: { id: string; status: QAItem["status"] } }
  | { type: "poll.pushed"; data: Poll }
  | { type: "poll.vote"; data: { pollId: string; optionId: string } }
  | { type: "poll.closed"; data: { pollId: string } }
  | { type: "presence.join"; data: PresenceUser }
  | { type: "presence.leave"; data: { id: string } }
  | { type: "hand.raise"; data: RaisedHand }
  | { type: "hand.lower"; data: { id: string } }
  | { type: "hand.unmute"; data: { id: string } }
  | { type: "hand.dismiss"; data: { id: string } }
  | { type: "rolling.summary"; data: RollingSummary };

type Listener = (msg: CuraLiveMessage) => void;

// ─── In-Memory Event Bus (simulates Ably channels) ────────────────────────────

class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(eventId: string, listener: Listener): () => void {
    if (!this.listeners.has(eventId)) this.listeners.set(eventId, new Set());
    this.listeners.get(eventId)!.add(listener);
    return () => { this.listeners.get(eventId)?.delete(listener); };
  }

  publish(eventId: string, msg: CuraLiveMessage) {
    this.listeners.get(eventId)?.forEach((l) => l(msg));
  }
}

// Singleton bus — shared across all components in the same browser session
const bus = new EventBus();

// ─── Simulated Data ───────────────────────────────────────────────────────────

const TRANSCRIPT_FEED: Omit<TranscriptSegment, "id">[] = [
  { speaker: "Operator", text: "Good morning and welcome to the CuraLive Q4 2025 Earnings Call. All participants will be in listen-only mode.", timestamp: 5, timeLabel: "00:00:05" },
  { speaker: "James Mitchell (CEO)", text: "Thank you, Operator. Good morning everyone. I'm delighted to share that Q4 has been an exceptional quarter for CuraLive.", timestamp: 72, timeLabel: "00:01:12" },
  { speaker: "James Mitchell (CEO)", text: "Our AI-powered platform, CuraLive, has seen remarkable adoption across our enterprise client base, with a 40% increase in engagement metrics.", timestamp: 150, timeLabel: "00:02:30" },
  { speaker: "Sarah Chen (CFO)", text: "Thank you James. From a financial perspective, Q4 revenue came in at $47.2 million, representing 28% year-over-year growth.", timestamp: 255, timeLabel: "00:04:15" },
  { speaker: "Sarah Chen (CFO)", text: "Our gross margins expanded to 72%, driven primarily by the efficiency gains from our new CuraLive intelligence layer.", timestamp: 340, timeLabel: "00:05:40" },
  { speaker: "James Mitchell (CEO)", text: "Looking ahead to 2026, we're particularly excited about our Teams and Zoom native integrations, which will open significant new enterprise opportunities.", timestamp: 442, timeLabel: "00:07:22" },
  { speaker: "Sarah Chen (CFO)", text: "We're guiding to full-year 2026 revenue of $195 to $210 million, with adjusted EBITDA margins of 18 to 22 percent.", timestamp: 545, timeLabel: "00:09:05" },
  { speaker: "Operator", text: "We will now open the line for questions. Please press star one to join the queue.", timestamp: 630, timeLabel: "00:10:30" },
  { speaker: "James Mitchell (CEO)", text: "The CuraLive platform represents a fundamental shift in how we deliver value to our clients. We're not just a conferencing provider anymore.", timestamp: 735, timeLabel: "00:12:15" },
  { speaker: "Sarah Chen (CFO)", text: "Capital expenditure for the year was $8.3 million, primarily invested in our AI infrastructure and the Ably real-time messaging integration.", timestamp: 840, timeLabel: "00:14:00" },
  { speaker: "James Mitchell (CEO)", text: "Our partnership with Recall.ai has been transformative. It allows us to deploy the CuraLive intelligence layer on any platform within days, not months.", timestamp: 1005, timeLabel: "00:16:45" },
  { speaker: "Sarah Chen (CFO)", text: "We ended the quarter with $124 million in cash and equivalents, providing significant runway to execute on our strategic roadmap.", timestamp: 1100, timeLabel: "00:18:20" },
];

const SENTIMENT_FEED = [72, 68, 75, 71, 78, 82, 79, 85, 81, 88, 84, 87];

const INITIAL_QA: QAItem[] = [
  { id: "qa-1", question: "Can you provide more detail on the CuraLive revenue contribution in Q4?", author: "Goldman Sachs", votes: 47, status: "pending", submittedAt: Date.now() - 60000 },
  { id: "qa-2", question: "What is the timeline for the native Microsoft Teams integration?", author: "JP Morgan", votes: 31, status: "pending", submittedAt: Date.now() - 45000 },
  { id: "qa-3", question: "How does the Recall.ai partnership affect your gross margin profile?", author: "Morgan Stanley", votes: 28, status: "approved", submittedAt: Date.now() - 30000 },
  { id: "qa-4", question: "Can you elaborate on the 40% engagement increase metric?", author: "Barclays", votes: 19, status: "answered", submittedAt: Date.now() - 90000 },
  { id: "qa-5", question: "What is the competitive moat against Zoom and Teams building similar features?", author: "UBS", votes: 15, status: "pending", submittedAt: Date.now() - 20000 },
];

// ─── Context ──────────────────────────────────────────────────────────────────

type AblyContextValue = {
  eventId: string;
  transcript: TranscriptSegment[];
  sentiment: SentimentUpdate;
  rollingSummary: RollingSummary | null;
  qaItems: QAItem[];
  polls: Poll[];
  raisedHands: RaisedHand[];
  presenceCount: number;
  isSimulating: boolean;
  mode: "demo" | "ably";
  publish: (msg: CuraLiveMessage) => void;
  chatTranslationEvents: ChatTranslationEvent[];
};

const AblyContext = createContext<AblyContextValue | null>(null);

export function AblyProvider({ eventId, children }: { eventId: string; children: React.ReactNode }) {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [sentiment, setSentiment] = useState<SentimentUpdate>({ score: 72, label: "Positive", timestamp: Date.now() });
  const [rollingSummary, setRollingSummary] = useState<RollingSummary | null>(null);
  const [qaItems, setQaItems] = useState<QAItem[]>(INITIAL_QA);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([]);
  const [presenceCount, setPresenceCount] = useState(1247);
  const [isSimulating, setIsSimulating] = useState(true);
  const [chatTranslationEvents, setChatTranslationEvents] = useState<ChatTranslationEvent[]>([]);
  const lineIdxRef = useRef(0);
  const sentimentIdxRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ablyChannelRef = useRef<any>(null);

  // Query the server for the Ably mode (demo vs real)
  const { data: ablyConfig } = trpc.ably.tokenRequest.useQuery({ clientId: `user-${Math.random().toString(36).slice(2)}` }, { retry: false, staleTime: Infinity });

  // Wire up real Ably channel when in production mode
  useEffect(() => {
    if (!ablyConfig || ablyConfig.mode !== "ably" || !ablyConfig.tokenRequest) return;
    let ablyClient: any;
    (async () => {
      try {
        const Ably = await import("ably");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ablyClient = new (Ably.default as any).Realtime({
          authCallback: (_data: unknown, callback: (err: string | null, token: unknown) => void) => {
            callback(null, ablyConfig.tokenRequest);
          }
        });
        const channel = ablyClient.channels.get(`curalive-event-${eventId}`);
        ablyChannelRef.current = channel;
        // Subscribe to all CuraLive message types over the real Ably channel
        channel.subscribe((msg: any) => {
          try {
            // Handle chat:translation events separately (not a CuraLiveMessage)
            if (msg.name === "chat:translation") {
              const data = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
              setChatTranslationEvents((prev) => [...prev, data as ChatTranslationEvent]);
              return;
            }
            const parsed: CuraLiveMessage = JSON.parse(msg.data);
            bus.publish(eventId, parsed);
          } catch {}
        });
        // Track presence
        channel.presence.subscribe("enter", () => setPresenceCount((c) => c + 1));
        channel.presence.subscribe("leave", () => setPresenceCount((c) => Math.max(0, c - 1)));
        channel.presence.enter({ name: "Attendee" });
      } catch (err) {
        console.warn("[CuraLive] Ably connection failed, falling back to demo mode:", err);
      }
    })();
    return () => { ablyClient?.close(); };
  }, [ablyConfig, eventId]);

  const publish = useCallback((msg: CuraLiveMessage) => {
    // Publish to local bus (for same-session sync)
    bus.publish(eventId, msg);
    // Also publish to real Ably channel if connected
    if (ablyChannelRef.current) {
      ablyChannelRef.current.publish("curalive", JSON.stringify(msg)).catch(console.warn);
    }
  }, [eventId]);

  // Subscribe to bus messages
  useEffect(() => {
    const unsub = bus.subscribe(eventId, (msg) => {
      switch (msg.type) {
        case "transcript.segment":
          setTranscript((prev) => [...prev, msg.data]);
          break;
        case "sentiment.update":
          setSentiment(msg.data);
          break;
        case "qa.submitted":
          setQaItems((prev) => [msg.data, ...prev]);
          break;
        case "qa.vote":
          setQaItems((prev) => prev.map((q) => q.id === msg.data.id ? { ...q, votes: msg.data.votes } : q));
          break;
        case "qa.status":
          setQaItems((prev) => prev.map((q) => q.id === msg.data.id ? { ...q, status: msg.data.status } : q));
          break;
        case "poll.pushed":
          setPolls((prev) => {
            const exists = prev.find((p) => p.id === msg.data.id);
            if (exists) return prev.map((p) => p.id === msg.data.id ? msg.data : p);
            return [...prev, msg.data];
          });
          break;
        case "poll.vote":
          setPolls((prev) => prev.map((p) => p.id === msg.data.pollId
            ? { ...p, options: p.options.map((o) => o.id === msg.data.optionId ? { ...o, votes: o.votes + 1 } : o) }
            : p));
          break;
        case "poll.closed":
          setPolls((prev) => prev.map((p) => p.id === msg.data.pollId ? { ...p, status: "closed" } : p));
          break;
        case "presence.join":
          setPresenceCount((c) => c + 1);
          break;
        case "presence.leave":
          setPresenceCount((c) => Math.max(0, c - 1));
          break;
        case "hand.raise":
          setRaisedHands((prev) => {
            if (prev.find((h) => h.id === msg.data.id)) return prev;
            return [...prev, msg.data];
          });
          break;
        case "hand.lower":
          setRaisedHands((prev) => prev.filter((h) => h.id !== msg.data.id));
          break;
        case "hand.unmute":
          setRaisedHands((prev) => prev.map((h) => h.id === msg.data.id ? { ...h, status: "unmuted" } : h));
          break;
        case "hand.dismiss":
          setRaisedHands((prev) => prev.filter((h) => h.id !== msg.data.id));
          break;
        case "rolling.summary":
          setRollingSummary(msg.data);
          break;
      }
    });
    return unsub;
  }, [eventId]);

  // Simulate transcript feed
  useEffect(() => {
    if (!isSimulating) return;
    const idx = lineIdxRef.current;
    if (idx >= TRANSCRIPT_FEED.length) { setIsSimulating(false); return; }
    const delay = idx === 0 ? 800 : 4200;
    const timer = setTimeout(() => {
      const line = TRANSCRIPT_FEED[idx];
      bus.publish(eventId, {
        type: "transcript.segment",
        data: { ...line, id: `seg-${idx}` },
      });
      lineIdxRef.current = idx + 1;
    }, delay);
    return () => clearTimeout(timer);
  }, [eventId, isSimulating, transcript.length]);

  // Simulate sentiment feed
  useEffect(() => {
    const timer = setInterval(() => {
      const idx = (sentimentIdxRef.current + 1) % SENTIMENT_FEED.length;
      sentimentIdxRef.current = idx;
      const score = SENTIMENT_FEED[idx];
      bus.publish(eventId, {
        type: "sentiment.update",
        data: { score, label: score >= 75 ? "Positive" : score >= 50 ? "Neutral" : "Negative", timestamp: Date.now() },
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [eventId]);

  const mode: "demo" | "ably" = ablyConfig?.mode === "ably" ? "ably" : "demo";

  return (
    <AblyContext.Provider value={{ eventId, transcript, sentiment, rollingSummary, qaItems, polls, raisedHands, presenceCount, isSimulating, mode, publish, chatTranslationEvents }}>
      {children}
    </AblyContext.Provider>
  );
}

export function useAbly() {
  const ctx = useContext(AblyContext);
  if (!ctx) throw new Error("useAbly must be used inside AblyProvider");
  return ctx;
}
